# backend/core/security.py

from typing import Optional
from fastapi import HTTPException
from starlette.types import ASGIApp, Receive, Scope, Send

class ContentSizeLimitMiddleware:
    """
    ASGI Middleware that streams incoming request chunks and instantly kills 
    the connection if the payload exceeds the maximum allowed size.
    """
    def __init__(self, app: ASGIApp, max_content_size: Optional[int] = None):
        self.app = app
        self.max_content_size = max_content_size

    def receive_wrapper(self, receive: Receive) -> Receive:
        received = 0

        async def inner():
            nonlocal received
            message = await receive()
            
            # We only care about HTTP requests with body content
            if message["type"] != "http.request" or self.max_content_size is None:
                return message
                
            body_len = len(message.get("body", b""))
            received += body_len

            if received > self.max_content_size:
                # 413 is the official HTTP status code for "Payload Too Large"
                raise HTTPException(status_code=413, detail="File exceeds the 5MB size limit.")

            return message

        return inner

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        wrapper = self.receive_wrapper(receive)
        await self.app(scope, wrapper, send)