from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    customer_id: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer_id: str
    customer_name: str