"""
Deploy Glimmer backend to free hosting service
"""

import os
import subprocess
import sys

def deploy_to_render():
    """Deploy to Render.com (free hosting)"""
    print("=== DEPLOY TO RENDER.COM ===")
    print("1. Creating render.yaml for deployment...")
    
    render_config = """
services:
  - type: web
    name: glimmer-api
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: python app.py
    envVars:
      - key: FLASK_ENV
        value: production
"""
    
    with open('render.yaml', 'w') as f:
        f.write(render_config)
    
    print("✅ render.yaml created")
    print("\n2. Next steps:")
    print("   - Go to https://render.com")
    print("   - Connect your GitHub repository")
    print("   - Upload render.yaml file")
    print("   - Deploy for free hosting")
    
    return "https://glimmer-api.onrender.com"

def deploy_to_railway():
    """Deploy to Railway.app (free hosting)"""
    print("=== DEPLOY TO RAILWAY.APP ===")
    print("1. Creating railway.json for deployment...")
    
    railway_config = {
        "build": {
            "builder": "NIXPACKS"
        },
        "deploy": {
            "startCommand": "python app.py",
            "restartPolicyType": "ON_FAILURE",
            "restartPolicyMaxRetries": 10
        }
    }
    
    import json
    with open('railway.json', 'w') as f:
        json.dump(railway_config, f, indent=2)
    
    print("✅ railway.json created")
    print("\n2. Next steps:")
    print("   - Go to https://railway.app")
    print("   - Connect your GitHub repository") 
    print("   - Upload railway.json file")
    print("   - Deploy for free hosting")
    
    return "https://glimmer-api.up.railway.app"

def create_simple_heroku():
    """Create Heroku deployment files"""
    print("=== DEPLOY TO HEROKU ===")
    print("1. Creating Heroku deployment files...")
    
    procfile = "web: python app.py"
    with open('Procfile', 'w') as f:
        f.write(procfile)
    
    runtime = "python-3.9.16"
    with open('runtime.txt', 'w') as f:
        f.write(runtime)
    
    print("✅ Procfile and runtime.txt created")
    print("\n2. Next steps:")
    print("   - Go to https://heroku.com")
    print("   - Create new app")
    print("   - Connect GitHub repository")
    print("   - Deploy for free hosting")
    
    return "https://glimmer-api.herokuapp.com"

if __name__ == '__main__':
    print("GLIMMER REMOTE DEPLOYMENT HELPER")
    print("Choose deployment option:")
    print("1. Render.com (recommended)")
    print("2. Railway.app")
    print("3. Heroku")
    
    choice = input("Enter choice (1-3): ").strip()
    
    if choice == "1":
        url = deploy_to_render()
    elif choice == "2":
        url = deploy_to_railway()
    elif choice == "3":
        url = create_simple_heroku()
    else:
        print("Invalid choice. Using Render.com...")
        url = deploy_to_render()
    
    print(f"\n🚀 YOUR NEW API URL: {url}")
    print("\n📝 UPDATE your frontend config:")
    print("   - Edit src/config/api.js")
    print("   - Change API_BASE_URL to your new URL")
    print("   - Restart frontend")
