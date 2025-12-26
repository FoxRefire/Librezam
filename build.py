import os
import zipfile
import shutil
import argparse
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class BuildHandler(FileSystemEventHandler):
    def __init__(self, base_dir, exclude_list, browsers):
        self.base_dir = base_dir
        self.exclude_list = exclude_list
        self.browsers = browsers
        self.last_build_time = 0
        self.build_delay = 1.0  # 1 second delay to prevent continuous changes

    def should_ignore(self, file_path):
        """Check if file should be ignored"""
        try:
            rel_path = os.path.relpath(file_path, self.base_dir)
        except ValueError:
            # Path is outside base_dir
            return True
        
        # Normalize path separators
        rel_path = rel_path.replace('\\', '/')
        
        # Check excluded files and directories
        # Note: manifest files are NOT excluded in watch mode as they trigger rebuilds
        for exclude in self.exclude_list:
            exclude_normalized = exclude.replace('\\', '/')
            if rel_path.startswith(exclude_normalized):
                return True
        
        return False

    def trigger_build(self, file_path):
        """Trigger build if conditions are met"""
        try:
            rel_path = os.path.relpath(file_path, self.base_dir)
        except ValueError:
            return
        
        if self.should_ignore(file_path):
            # Debug: uncomment to see ignored files
            # print(f"[WATCH] Ignored: {rel_path}")
            return
        
        current_time = time.time()
        if current_time - self.last_build_time < self.build_delay:
            return
        
        self.last_build_time = current_time
        print(f"\n[WATCH] File changed: {rel_path}")
        print("[WATCH] Starting rebuild...")
        self.build_all()

    def on_modified(self, event):
        if event.is_directory:
            return
        self.trigger_build(event.src_path)

    def on_created(self, event):
        if event.is_directory:
            return
        self.trigger_build(event.src_path)

    def on_deleted(self, event):
        if event.is_directory:
            return
        # Even if file is deleted, we should rebuild
        self.trigger_build(event.src_path)

    def on_moved(self, event):
        if event.is_directory:
            return
        # Handle both source and destination
        if hasattr(event, 'src_path'):
            self.trigger_build(event.src_path)
        if hasattr(event, 'dest_path'):
            self.trigger_build(event.dest_path)

    def build_all(self):
        for browser in self.browsers:
            zip_directory(self.base_dir, browser, self.exclude_list)
            create_unpacked_directory(self.base_dir, browser, self.exclude_list)
        print("Build completed.")

def zip_directory(base_dir, browser, exclude_list):
    os.makedirs('dist', exist_ok=True)
    exclude_list = set(exclude_list)

    def should_include(path):
        rel_path = os.path.relpath(path, base_dir)
        return not any(rel_path.startswith(exclude) for exclude in exclude_list)

    with zipfile.ZipFile(os.path.join(base_dir, f'dist/{browser}.zip'), 'w', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.write(f'manifest_{browser}.json', arcname='manifest.json')
        for foldername, subfolders, filenames in os.walk(base_dir):
            subfolders[:] = [f for f in subfolders if should_include(os.path.join(foldername, f))]
            for filename in filenames:
                file_path = os.path.join(foldername, filename)
                if should_include(file_path):
                    arcname = os.path.relpath(file_path, base_dir)
                    zip_file.write(file_path, arcname=arcname)

def create_unpacked_directory(base_dir, browser, exclude_list):
    """Create unpacked directory"""
    unpacked_dir = os.path.join(base_dir, 'dist', f'{browser}_unpacked')
    
    # Remove existing directory and create new one
    if os.path.exists(unpacked_dir):
        shutil.rmtree(unpacked_dir)
    os.makedirs(unpacked_dir, exist_ok=True)
    
    exclude_list = set(exclude_list)
    
    def should_include(path):
        rel_path = os.path.relpath(path, base_dir)
        return not any(rel_path.startswith(exclude) for exclude in exclude_list)
    
    # Copy manifest file
    shutil.copy2(f'manifest_{browser}.json', os.path.join(unpacked_dir, 'manifest.json'))
    
    # Copy other files
    for foldername, subfolders, filenames in os.walk(base_dir):
        subfolders[:] = [f for f in subfolders if should_include(os.path.join(foldername, f))]
        for filename in filenames:
            file_path = os.path.join(foldername, filename)
            if should_include(file_path):
                rel_path = os.path.relpath(file_path, base_dir)
                dest_path = os.path.join(unpacked_dir, rel_path)
                dest_dir = os.path.dirname(dest_path)
                os.makedirs(dest_dir, exist_ok=True)
                shutil.copy2(file_path, dest_path)

def build_all(base_dir, exclude_list, browsers):
    """Build for all browsers"""
    print("Starting build...")
    for browser in browsers:
        print(f"  Creating {browser} ZIP file...")
        zip_directory(base_dir, browser, exclude_list)
        print(f"  Creating {browser} unpacked directory...")
        create_unpacked_directory(base_dir, browser, exclude_list)
    print("Build completed.")

def watch_mode(base_dir, exclude_list, browsers):
    """Run build in file watch mode"""
    print("Starting file watch mode...")
    print("Files will be automatically rebuilt when changed.")
    print("Press Ctrl+C to stop watching.")
    
    # Perform initial build
    print("\nPerforming initial build...")
    build_all(base_dir, exclude_list, browsers)
    print("\nWatching for file changes...\n")
    
    event_handler = BuildHandler(base_dir, exclude_list, browsers)
    observer = Observer()
    observer.schedule(event_handler, base_dir, recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping file watcher...")
        observer.stop()
    observer.join()
    print("File watching stopped.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='BenchmarkIt! Extension Build Script')
    parser.add_argument('--watch', '-w', action='store_true', 
                       help='Enable file watch mode for automatic rebuild')
    parser.add_argument('--browsers', '-b', nargs='+', 
                       choices=['chrome', 'firefox'], 
                       default=['chrome', 'firefox'],
                       help='Specify browsers to build (default: chrome firefox)')
    parser.add_argument('--zip-only', action='store_true',
                       help='Create only ZIP files (no unpacked directories)')
    parser.add_argument('--unpacked-only', action='store_true',
                       help='Create only unpacked directories (no ZIP files)')
    
    args = parser.parse_args()
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # For watch mode, don't exclude manifest files as they should trigger rebuilds
    # For normal build, exclude them to avoid copying them to dist
    exclude_list = ['dist', 'manifest.json', 'build.py', '.git', '.gitignore', 'requirements.txt']
    if not args.watch:
        # In non-watch mode, exclude manifest files from being copied
        exclude_list.extend(['manifest_chrome.json', 'manifest_firefox.json', 'manifest_ffdroid.json'])
    
    if args.watch:
        watch_mode(base_dir, exclude_list, args.browsers)
    else:
        if args.zip_only:
            print("Creating ZIP files only...")
            for browser in args.browsers:
                zip_directory(base_dir, browser, exclude_list)
        elif args.unpacked_only:
            print("Creating unpacked directories only...")
            for browser in args.browsers:
                create_unpacked_directory(base_dir, browser, exclude_list)
        else:
            build_all(base_dir, exclude_list, args.browsers)
