import os
import time
from dotenv import load_dotenv
from box_sdk_gen import BoxClient, BoxJWTAuth, JWTConfig

# Load environment variables
load_dotenv()

def get_box_client():
    """
    Authenticate with Box using JWT
    """
    try:
        # Get JWT authentication parameters from environment variables
        client_id = os.getenv("BOX_CLIENT_ID")
        client_secret = os.getenv("BOX_CLIENT_SECRET")
        enterprise_id = os.getenv("BOX_ENTERPRISE_ID")
        jwt_key_id = os.getenv("BOX_JWT_KEY_ID")
        private_key = os.getenv("BOX_PRIVATE_KEY")
        passphrase = os.getenv("BOX_PASSPHRASE")
        
        # Check if required variables are present
        if not all([client_id, client_secret, enterprise_id, jwt_key_id, private_key]):
            print("Missing required Box authentication variables. Check your .env file.")
            raise ValueError("Missing required Box authentication variables")
        
         # Format the private key properly - ensure it has proper line breaks
        # This is a common issue when private keys are stored in environment variables
        if private_key and "-----BEGIN" in private_key and "\n" not in private_key:
            # Add line breaks every 64 characters for the base64 encoded part
            header = "-----BEGIN ENCRYPTED PRIVATE KEY-----\n"
            footer = "\n-----END ENCRYPTED PRIVATE KEY-----"
            
            # Extract the base64 content between the header and footer
            if "-----BEGIN ENCRYPTED PRIVATE KEY-----" in private_key:
                base64_content = private_key.replace("-----BEGIN ENCRYPTED PRIVATE KEY-----", "").replace("-----END ENCRYPTED PRIVATE KEY-----", "").strip()
                # Insert a newline every 64 characters
                formatted_content = '\n'.join([base64_content[i:i+64] for i in range(0, len(base64_content), 64)])
                private_key = header + formatted_content + footer

        # Create JWT config
        jwt_config = JWTConfig(
            client_id=client_id,
            client_secret=client_secret,
            jwt_key_id=jwt_key_id,
            private_key=private_key,
            private_key_passphrase=passphrase,
            enterprise_id=enterprise_id,
        )
        
        # Authenticate
        auth = BoxJWTAuth(config=jwt_config)
        client = BoxClient(auth=auth)
        return client
    except Exception as e:
        print(f"Error authenticating with Box: {str(e)}")
        # Provide more detailed error information for debugging
        if "Could not deserialize key data" in str(e):
            print("\nPrivate key format issue detected. Please check:")
            print("1. The private key format (should be PEM format)")
            print("2. The passphrase is correct")
            print("3. The key is not using an unsupported algorithm")
            print("\nIf storing in an environment variable, ensure proper line breaks are preserved.")
        raise

def download_file(client, file_id, file_name, target_path):
    """
    Download a file from Box to the specified path
    """
    try:
        print(f"Downloading: {file_name} -> {target_path}")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        # Download the file
        with open(target_path, 'wb') as output_file:
            client.downloads.download_file_to_output_stream(file_id, output_file)
        
        # Get file size for verification
        file_size = os.path.getsize(target_path)
        print(f"✅ Downloaded: {file_name} ({file_size} bytes)")
        return True
    except Exception as e:
        print(f"❌ Error downloading {file_name}: {str(e)}")
        return False

def should_download_file(client, item, local_file_path, download_mode):
    """
    Determine if a file should be downloaded based on the download mode
    """
    # If file doesn't exist locally, always download
    if not os.path.exists(local_file_path):
        return True, "New file"
        
    # If mode is overwrite, always download
    if download_mode == "overwrite":
        return True, "Overwrite mode"
        
    # If mode is skip, never download existing files
    if download_mode == "skip":
        return False, "File exists locally"
        
    # If mode is smart, check if file has changed
    if download_mode == "smart":
        try:
            # Get file info from Box
            file_info = client.files.get_file_by_id(item.id)
            
            # Get local file size and modification time
            local_size = os.path.getsize(local_file_path)
            local_mtime = os.path.getmtime(local_file_path)
            
            # Handle Box's modified_at which could be a datetime object or a string
            if isinstance(file_info.modified_at, str):
                box_mtime = time.mktime(time.strptime(file_info.modified_at, "%Y-%m-%dT%H:%M:%S%z"))
            else:
                # If it's already a datetime object, convert directly to timestamp
                box_mtime = file_info.modified_at.timestamp()
            
            # Compare file sizes
            if file_info.size != local_size:
                return True, "File size changed"
                
            # Compare modification times (with a small buffer to account for time zone differences)
            if box_mtime > local_mtime + 60:  # 60 seconds buffer
                return True, "File modified more recently on Box"
                
            return False, "File unchanged"
            
        except Exception as e:
            print(f"Error checking file status: {str(e)}")
            # If we can't determine, download to be safe
            return True, "Error checking status"
    
    # Default case
    return True, "Unknown mode"

def process_folder_contents(client, folder_id, local_base_path, current_path="", download_mode="skip"):
    """
    Process contents of a folder without creating a subfolder for the root
    """
    try:
        # Get folder info
        folder = client.folders.get_folder_by_id(folder_id)
        print(f"📁 Processing folder contents: {folder.name} (ID: {folder.id})")
        
        # Get items in the folder
        items = client.folders.get_folder_items(folder_id)
        print(f"Found {len(items.entries)} items in folder {folder.name}")
        
        # Track statistics
        stats = {
            "total_files": 0,
            "downloaded_files": 0,
            "skipped_files": 0,
            "unchanged_files": 0,
            "failed_files": 0,
            "total_folders": 0
        }
        
        # Process each item
        for item in items.entries:
            if item.type == "folder":
                # For subfolders, create the folder and process its contents
                stats["total_folders"] += 1
                
                # Create subfolder path
                subfolder_path = os.path.join(current_path, item.name)
                local_subfolder_path = os.path.join(local_base_path, subfolder_path)
                
                # Create the subfolder
                os.makedirs(local_subfolder_path, exist_ok=True)
                
                # Process the subfolder contents
                sub_stats = walk_and_download_files(
                    client, 
                    item.id, 
                    local_base_path, 
                    subfolder_path,
                    download_mode
                )
                
                # Aggregate statistics
                for key in stats:
                    if key in sub_stats:
                        stats[key] += sub_stats[key]
                
            elif item.type == "file":
                stats["total_files"] += 1
                
                # Determine local file path
                local_file_path = os.path.join(local_base_path, current_path, item.name)
                
                # Check if file should be downloaded
                should_download, reason = should_download_file(client, item, local_file_path, download_mode)
                
                if not should_download:
                    if reason == "File unchanged":
                        print(f"🔄 Skipping unchanged file: {item.name}")
                        stats["unchanged_files"] += 1
                    else:
                        print(f"⏩ Skipping existing file: {item.name}")
                        stats["skipped_files"] += 1
                    continue
                
                # Download the file
                success = download_file(client, item.id, item.name, local_file_path)
                
                if success:
                    stats["downloaded_files"] += 1
                else:
                    stats["failed_files"] += 1
                
                # Add a small delay to avoid rate limiting
                time.sleep(0.1)
        
        return stats
    
    except Exception as e:
        print(f"Error processing folder {folder_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "total_files": 0,
            "downloaded_files": 0,
            "skipped_files": 0,
            "unchanged_files": 0,
            "failed_files": 0,
            "total_folders": 0
        }

def walk_and_download_files(client, folder_id, local_base_path, current_path="", download_mode="skip"):
    """
    Recursively walk through Box folders and download all files
    """
    try:
        # Get folder info
        folder = client.folders.get_folder_by_id(folder_id)
        print(f"📁 Processing folder: {folder.name} (ID: {folder.id})")
        
        # Get items in the folder
        items = client.folders.get_folder_items(folder_id)
        print(f"Found {len(items.entries)} items in folder {folder.name}")
        
        # Track statistics
        stats = {
            "total_files": 0,
            "downloaded_files": 0,
            "skipped_files": 0,
            "unchanged_files": 0,
            "failed_files": 0,
            "total_folders": 0
        }
        
        # Process each item
        for item in items.entries:
            if item.type == "folder":
                # Recursively process subfolders
                stats["total_folders"] += 1
                
                # Create subfolder path
                subfolder_path = os.path.join(current_path, item.name)
                local_subfolder_path = os.path.join(local_base_path, subfolder_path)
                
                # Create the subfolder
                os.makedirs(local_subfolder_path, exist_ok=True)
                
                sub_stats = walk_and_download_files(
                    client, 
                    item.id, 
                    local_base_path, 
                    subfolder_path,
                    download_mode
                )
                
                # Aggregate statistics
                for key in stats:
                    if key in sub_stats:
                        stats[key] += sub_stats[key]
                
            elif item.type == "file":
                stats["total_files"] += 1
                
                # Determine local file path
                local_file_path = os.path.join(local_base_path, current_path, item.name)
                
                # Check if file should be downloaded
                should_download, reason = should_download_file(client, item, local_file_path, download_mode)
                
                if not should_download:
                    if reason == "File unchanged":
                        print(f"🔄 Skipping unchanged file: {item.name}")
                        stats["unchanged_files"] += 1
                    else:
                        print(f"⏩ Skipping existing file: {item.name}")
                        stats["skipped_files"] += 1
                    continue
                
                # Download the file
                success = download_file(client, item.id, item.name, local_file_path)
                
                if success:
                    stats["downloaded_files"] += 1
                else:
                    stats["failed_files"] += 1
                
                # Add a small delay to avoid rate limiting
                time.sleep(0.1)
        
        return stats
    
    except Exception as e:
        print(f"Error processing folder {folder_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "total_files": 0,
            "downloaded_files": 0,
            "skipped_files": 0,
            "unchanged_files": 0,
            "failed_files": 0,
            "total_folders": 0
        }

def main():
    print("📦 Box File Downloader 📦")
    print("This script will download all files from Box to a local 'Docs' folder")
    
    # Ask for confirmation
    try:
        confirm = input("Do you want to proceed? (y/n): ").lower()
        if confirm != 'y':
            print("Operation cancelled.")
            return
    except KeyboardInterrupt:
        print("\nOperation cancelled.")
        return
    
    # Ask for download mode
    try:
        print("\nChoose download mode:")
        print("1. Overwrite all files (download everything)")
        print("2. Skip existing files (download only new files)")
        print("3. Smart mode (download new files and changed files)")
        
        mode_choice = input("Enter your choice (1-3, default: 2): ").strip()
        
        if mode_choice == "1":
            download_mode = "overwrite"
        elif mode_choice == "3":
            download_mode = "smart"
        else:
            download_mode = "skip"  # Default or if user enters "2"
            
        print(f"Selected mode: {download_mode}")
    except KeyboardInterrupt:
        print("\nOperation cancelled.")
        return
    
    try:
        # Get Box client using JWT auth
        client = get_box_client()
        
        # Test authentication
        service_account = client.users.get_user_me()
        print(f"Authenticated as service account: {service_account.name} (ID: {service_account.id})")
        
        # Create the base directory if it doesn't exist
        os.makedirs("Documents", exist_ok=True)
        
        # Start time
        start_time = time.time()
        
        # Walk through all files and folders and download them
        print("\n===== Starting download of all Box files =====")
        
        # Use the folder_id parameter explicitly to specify the JNJ folder
        folder_id = os.getenv("BOX_ROOT_FOLDER_ID", "0")
        
        # Use the new function that processes contents directly without creating a subfolder for the root
        stats = process_folder_contents(
            client, 
            folder_id=folder_id,
            local_base_path="Documents", 
            download_mode=download_mode
        )
        
        # End time
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        print("\n===== Download Summary =====")
        print(f"Total folders processed: {stats['total_folders']}")
        print(f"Total files found: {stats['total_files']}")
        print(f"Files downloaded: {stats['downloaded_files']}")
        print(f"Files skipped (already exist): {stats['skipped_files']}")
        if 'unchanged_files' in stats:
            print(f"Files unchanged (smart mode): {stats['unchanged_files']}")
        print(f"Files failed to download: {stats['failed_files']}")
        print(f"Total time: {duration:.2f} seconds")
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 