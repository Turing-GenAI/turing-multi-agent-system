from fastapi import FastAPI, Request, HTTPException
import subprocess

app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Deployment Webhook API. Use /payload for webhook requests."}

@app.post("/payload")
async def payload(request: Request):
    data = await request.json()
    
    # Check if the 'ref' key exists in the payload.
    if "ref" not in data:
        raise HTTPException(status_code=400, detail="No 'ref' field found in the payload.")
    
    # Only trigger deployment if the push is to the "dev" branch.
    if data["ref"] != "refs/heads/launchpad_dev":
        print("Push event not on dev branch; no action taken. Received ref:", data["ref"])
        return {"message": "No deployment triggered. Not on dev branch."}
    
    try:
        # Call the deploy bash script.
        # subprocess.run(
        #     ["/bin/bash", "/home/azureuser/deploy.sh"],
        #     check=True
        # )
        subprocess.Popen(
            ["/bin/bash", "/home/azureuser/deploy.sh"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return {"message": "Deploy script has started running."}
    except subprocess.CalledProcessError as e:
        print("Error executing deploy script:", e)
        raise HTTPException(status_code=500, detail="Deployment failed.")
