from app.database import Base, engine
from app.models import (
    PortfolioHolding,
    Stock,
    User,
    WatchlistItem,
    WishlistItem,
    Feedback,
)


print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")