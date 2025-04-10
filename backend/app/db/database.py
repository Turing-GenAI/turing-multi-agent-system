from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get the database directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATABASE_DIR = os.path.join(BASE_DIR, "data")

# Create the database directory if it doesn't exist
os.makedirs(DATABASE_DIR, exist_ok=True)

# SQLite database URL
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'compliance_reviews.db')}"

# Create SQLAlchemy engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Counter for generating sequential review IDs
review_counter = 0

def get_db():
    """
    Dependency for getting a database session.
    Used in FastAPI dependency injection system.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_review_id():
    """
    Generate a sequential review ID in the format R-00001
    Uses a database-stored counter to maintain sequence
    """
    from app.db.models.models import Base, Review
    import re
    
    # Initialize database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Get a session
    db = SessionLocal()
    
    try:
        # Get all reviews and sort them by ID to find the highest numberic value
        all_reviews = db.query(Review).all()
        
        if all_reviews:
            # Extract numeric parts from all review IDs
            numeric_values = []
            pattern = r'R-0*([1-9][0-9]*)'
            
            for review in all_reviews:
                if review.id and review.id.startswith('R-'):
                    match = re.match(pattern, review.id)
                    if match:
                        try:
                            numeric_values.append(int(match.group(1)))
                        except (ValueError, IndexError):
                            pass
            
            # Find the highest numeric value if any valid IDs exist
            if numeric_values:
                next_num = max(numeric_values) + 1
            else:
                next_num = 1
        else:
            # Start from 1 if no reviews exist
            next_num = 1
            
        # Format with leading zeros (5 digits)
        new_id = f"R-{next_num:05d}"
        
        # Double-check the ID doesn't already exist
        existing = db.query(Review).filter(Review.id == new_id).first()
        if existing:
            # If somehow this ID exists, increment until we find an unused one
            while existing:
                next_num += 1
                new_id = f"R-{next_num:05d}"
                existing = db.query(Review).filter(Review.id == new_id).first()
        
        return new_id
    
    finally:
        db.close()
