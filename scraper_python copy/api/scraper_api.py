from fastapi import FastAPI
from scraper import executar_scraper

app = FastAPI()

@app.get("/scrape")
async def scrape():
    produtos = await executar_scraper()
    return produtos