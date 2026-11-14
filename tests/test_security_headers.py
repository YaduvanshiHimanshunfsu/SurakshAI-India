import asyncio
import sys

import httpx
import pytest

from app.main import create_app

pytestmark = pytest.mark.skipif(sys.platform == 'win32', reason='Local Windows asyncio runtime cannot create its self-pipe; run this ASGI integration test on Linux CI/Vercel.')


def test_security_headers_are_set_without_starting_provider_services() -> None:
    async def request() -> httpx.Response:
        app = create_app()
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url='http://testserver') as client:
            return await client.get('/api/v1/health')
    response = asyncio.run(request())
    assert response.status_code == 200
    assert "default-src 'self'" in response.headers['content-security-policy']
    assert response.headers['permissions-policy'].startswith('microphone=(self)')
    assert response.headers['x-frame-options'] == 'DENY'
