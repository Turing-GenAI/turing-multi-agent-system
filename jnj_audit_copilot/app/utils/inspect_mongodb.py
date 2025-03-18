import os
from pymongo import MongoClient
from dotenv import load_dotenv
import json
from ..utils.mongo_vcore_vector_client import MongoVCoreVectorClient
from ..utils.langchain_azure_openai import azure_embedding_openai_client

# Load environment variables
load_dotenv()

def clear_mongodb():
    """
    Clear all collections in the MongoDB database.
    This will delete all data before we run the create_vector_store script.
    """
    # Get MongoDB connection string from environment
    connection_string = os.getenv("MONGODB_CONNECTION_STRING")
    database_name = os.getenv("MONGODB_DATABASE_NAME", "vector_db")
    
    if not connection_string:
        print("Error: MONGODB_CONNECTION_STRING not found in environment variables")
        return
    
    try:
        # Connect to MongoDB
        print(f"Connecting to MongoDB database: {database_name} to clear data...")
        client = MongoClient(connection_string)
        
        # Check connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB")
        
        # Get database
        db = client[database_name]
        
        # List all collections
        collections = db.list_collection_names()
        if not collections:
            print("No collections found in the database")
        else:
            print(f"Found {len(collections)} collections to delete:")
            for collection in collections:
                print(f"  - Dropping collection: {collection}")
                db.drop_collection(collection)
            print("All collections have been dropped successfully")
    
    except Exception as e:
        print(f"Error clearing MongoDB: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()
            print("MongoDB connection closed")

def inspect_mongodb():
    """
    Inspect the MongoDB database to check collections and document counts.
    This can help diagnose issues with the MongoDB vector store.
    """
    # Get MongoDB connection string from environment
    connection_string = os.getenv("MONGODB_CONNECTION_STRING")
    database_name = os.getenv("MONGODB_DATABASE_NAME", "vector_db")
    
    if not connection_string:
        print("Error: MONGODB_CONNECTION_STRING not found in environment variables")
        return
    
    try:
        # Connect to MongoDB
        print(f"Connecting to MongoDB database: {database_name}...")
        client = MongoClient(connection_string)
        
        # Check connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB")
        
        # Get database
        db = client[database_name]
        
        # List all collections
        print("\n=== Collections in Database ===")
        collections = db.list_collection_names()
        if not collections:
            print("No collections found in the database")
        else:
            print(f"Found {len(collections)} collections:")
            for collection in collections:
                count = db[collection].count_documents({})
                print(f"  - {collection} ({count} documents)")
        
        # Examine each collection
        for collection_name in collections:
            collection = db[collection_name]
            print(f"\n=== Collection: {collection_name} ===")
            
            # Get document count
            count = collection.count_documents({})
            print(f"Document count: {count}")
            
            # Check indexes
            print("Indexes:")
            for index in collection.list_indexes():
                print(f"  - {json.dumps(index, default=str)}")
            
            # Sample a few documents
            if count > 0:
                print("\nSample documents:")
                samples = collection.find().limit(2)
                for i, doc in enumerate(samples):
                    # Remove embedding field as it's too large to display
                    if 'embedding' in doc:
                        doc['embedding'] = f"[Vector with {len(doc['embedding'])} dimensions]"
                    print(f"\nDocument {i+1}:")
                    print(json.dumps(doc, indent=2, default=str))
    
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()
            print("\nMongoDB connection closed")

def test_similarity_search():
    """
    Test similarity search functionality on existing MongoDB collections.
    """
    # Get MongoDB connection info
    connection_string = os.getenv("MONGODB_CONNECTION_STRING")
    database_name = os.getenv("MONGODB_DATABASE_NAME", "vector_db")
    
    if not connection_string:
        print("Error: MONGODB_CONNECTION_STRING not found in environment variables")
        return
    
    try:
        # Connect to MongoDB to list collections
        client = MongoClient(connection_string)
        db = client[database_name]
        
        # Get list of collections
        collections = db.list_collection_names()
        if not collections:
            print("No collections found. Please run create_vector_store.py first.")
            return
        
        print(f"Found {len(collections)} collections: {collections}")
        
        # Choose a collection format to test
        guideline_collections = [c for c in collections if c.startswith("guidelines_")]
        summary_collections = [c for c in collections if c.startswith("summaries_")]
        
        # Test queries
        test_queries = [
            "What should we look for in audit documentation?",
            "How to handle protocol deviations?",
            "What are the data quality requirements?",
            "Common issues with informed consent?"
        ]
        
        # Test similarity search on guideline collections
        if guideline_collections:
            print("\n=== Testing similarity search on guideline collections ===")
            collection_name = guideline_collections[0]
            print(f"Using collection: {collection_name}")
            
            vector_client = MongoVCoreVectorClient(
                collection_name=collection_name,
                embedding_function=azure_embedding_openai_client,
                create_vector_index=False  # Don't create an index for testing
            )
            
            for query in test_queries:
                print(f"\nQuery: {query}")
                try:
                    # Try the search with fallback to manual search if vector search fails
                    try:
                        results = vector_client.similarity_search(query, k=2)
                        if results:
                            print(f"Found {len(results)} results using vector search")
                            for i, doc in enumerate(results):
                                print(f"Result {i+1}:")
                                print(f"Content: {doc.page_content[:50]}...")
                                print(f"Metadata: {doc.metadata}")
                        else:
                            print("No results found using vector search")
                    except Exception as e:
                        print(f"Vector search failed: {str(e)}")
                        print("Falling back to basic retrieval...")
                        
                        # Fallback: Get a few random documents if vector search failed
                        samples = list(db[collection_name].find().limit(2))
                        print(f"Retrieved {len(samples)} random documents as fallback:")
                        for i, doc in enumerate(samples):
                            content = doc.get('page_content', '')[:50]
                            metadata = doc.get('metadata', {})
                            print(f"Document {i+1}:")
                            print(f"Content: {content}...")
                            print(f"Metadata: {metadata}")
                except Exception as search_error:
                    print(f"Error during search: {str(search_error)}")
        
        # Test similarity search on summary collections
        if summary_collections:
            print("\n=== Testing similarity search on summary collections ===")
            collection_name = summary_collections[0]
            print(f"Using collection: {collection_name}")
            
            vector_client = MongoVCoreVectorClient(
                collection_name=collection_name,
                embedding_function=azure_embedding_openai_client,
                create_vector_index=False  # Don't create an index for testing
            )
            
            for query in test_queries:
                print(f"\nQuery: {query}")
                try:
                    # Try the search with fallback to manual search if vector search fails
                    try:
                        results = vector_client.similarity_search(query, k=2)
                        if results:
                            print(f"Found {len(results)} results using vector search")
                            for i, doc in enumerate(results):
                                print(f"Result {i+1}:")
                                print(f"Content: {doc.page_content[:50]}...")
                                print(f"Metadata: {doc.metadata}")
                        else:
                            print("No results found using vector search")
                    except Exception as e:
                        print(f"Vector search failed: {str(e)}")
                        print("Falling back to basic retrieval...")
                        
                        # Fallback: Get a few random documents if vector search failed
                        samples = list(db[collection_name].find().limit(2))
                        print(f"Retrieved {len(samples)} random documents as fallback:")
                        for i, doc in enumerate(samples):
                            content = doc.get('page_content', '')[:50]
                            metadata = doc.get('metadata', {})
                            print(f"Document {i+1}:")
                            print(f"Content: {content}...")
                            print(f"Metadata: {metadata}")
                except Exception as search_error:
                    print(f"Error during search: {str(search_error)}")
                    
    except Exception as e:
        print(f"Error testing similarity search: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()
            print("\nMongoDB connection closed")

if __name__ == "__main__":
    # Ask the user if they want to clear the database
    response = input("Do you want to clear all data in MongoDB before inspecting? (y/n): ")
    if response.lower() == 'y':
        clear_mongodb()
    
    inspect_mongodb()
    test_similarity_search() 