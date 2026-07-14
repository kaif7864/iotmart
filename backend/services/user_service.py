def serialize_user(user: dict) -> dict:
    """Safely serializes a MongoDB user document into a dict for API responses."""
    if not user:
        return None
        
    return {
        "_id": str(user["_id"]),
        "first_name": user.get("first_name", user.get("name", "").split(" ")[0] if user.get("name") else ""),
        "last_name": user.get("last_name", user.get("name", "").split(" ")[-1] if user.get("name") and " " in user.get("name") else ""),
        "phone": user.get("phone", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
        "status": user.get("status", "active"),
        "profile_picture": user.get("profile_picture", ""),
        "wishlist": user.get("wishlist", []),
        "addresses": user.get("addresses", []),
        "email_verified": user.get("email_verified", False),
        "mobile_verified": user.get("mobile_verified", False),
        "has_custom_password": user.get("has_custom_password", True)
    }
