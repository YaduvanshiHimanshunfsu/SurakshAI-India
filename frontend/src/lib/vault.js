const DATABASE = 'surakshai-evidence-vault'
const VERSION = 1
const KEY_ID = 'device-key-v1'
const MAX_TEXT_BYTES = 50_000

function assertAvailable() {
  if (!globalThis.indexedDB || !globalThis.crypto?.subtle) {
    throw new Error('Secure local evidence storage is not supported by this browser.')
  }
}

function request(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Local storage request failed.'))
  })
}

function completed(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error('Local storage transaction failed.'))
    transaction.onabort = () => reject(transaction.error || new Error('Local storage transaction was aborted.'))
  })
}

async function openVault() {
  assertAvailable()
  const openRequest = indexedDB.open(DATABASE, VERSION)
  openRequest.onupgradeneeded = () => {
    const database = openRequest.result
    database.createObjectStore('keys', { keyPath: 'id' })
    const evidence = database.createObjectStore('evidence', { keyPath: 'id' })
    evidence.createIndex('caseId', 'caseId', { unique: false })
    evidence.createIndex('createdAt', 'createdAt', { unique: false })
  }
  return request(openRequest)
}

async function deviceKey(database) {
  const read = database.transaction('keys', 'readonly')
  const saved = await request(read.objectStore('keys').get(KEY_ID))
  await completed(read)
  if (saved?.key) return saved.key

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const write = database.transaction('keys', 'readwrite')
  write.objectStore('keys').put({ id: KEY_ID, key })
  await completed(write)
  return key
}

function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function aad(record) {
  return new TextEncoder().encode(`${record.caseId}:${record.kind}:${record.id}`)
}

export async function saveEvidence({ caseId, kind, content, note = '' }) {
  assertAvailable()
  const cleanContent = String(content || '').trim()
  if (!caseId || !kind || !cleanContent) throw new Error('A case ID, evidence type, and evidence text are required.')
  if (new TextEncoder().encode(cleanContent).byteLength > MAX_TEXT_BYTES) throw new Error('Evidence text is limited to 50 KB.')

  const database = await openVault()
  try {
    const key = await deviceKey(database)
    const record = { id: newId(), caseId, kind, createdAt: new Date().toISOString(), note: String(note).slice(0, 280) }
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: aad(record) }, key, new TextEncoder().encode(cleanContent),
    )
    const write = database.transaction('evidence', 'readwrite')
    write.objectStore('evidence').put({ ...record, iv: iv.buffer, encrypted })
    await completed(write)
    return metadata(record)
  } finally {
    database.close()
  }
}

function metadata(record) {
  return { id: record.id, caseId: record.caseId, kind: record.kind, createdAt: record.createdAt, note: record.note || '' }
}

export async function listEvidence(caseId) {
  const database = await openVault()
  try {
    const transaction = database.transaction('evidence', 'readonly')
    const records = await request(transaction.objectStore('evidence').index('caseId').getAll(caseId))
    await completed(transaction)
    return records.map(metadata).sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  } finally {
    database.close()
  }
}

export async function readEvidence(caseId) {
  const database = await openVault()
  try {
    const key = await deviceKey(database)
    const transaction = database.transaction('evidence', 'readonly')
    const records = await request(transaction.objectStore('evidence').index('caseId').getAll(caseId))
    await completed(transaction)
    return Promise.all(records.map(async (record) => {
      const bytes = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: record.iv, additionalData: aad(record) }, key, record.encrypted,
      )
      return { ...metadata(record), content: new TextDecoder().decode(bytes) }
    }))
  } finally {
    database.close()
  }
}

export async function deleteEvidence(id) {
  const database = await openVault()
  try {
    const transaction = database.transaction('evidence', 'readwrite')
    transaction.objectStore('evidence').delete(id)
    await completed(transaction)
  } finally {
    database.close()
  }
}

export async function vaultIsAvailable() {
  try {
    assertAvailable()
    const database = await openVault()
    database.close()
    return true
  } catch {
    return false
  }
}
