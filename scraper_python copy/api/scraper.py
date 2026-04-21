from playwright.async_api import async_playwright
import time
import re
from database.mainDb import salvar_no_banco
from urllib.parse import unquote

async def executar_scraper():

    pagina = 1

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080} # Define um tamanho de tela real
        )
        page = await context.new_page()

        await page.goto("https://www.amazon.com.br/s?k=livros+classicos&i=stripbooks&crid=1GPA6F811WTXY&sprefix=livros+classi%2Cstripbooks%2C216&ref=nb_sb_ss_ts-doa-p_1_13")

        elementos = page.locator('[data-component-type="s-search-result"]')        

        while True:
            for i in range(await elementos.count()):
                try:
                    produto = elementos.nth(i)

                    name = await produto.locator('a h2 span').inner_text()

                    image_locator = produto.locator('img.s-image')
                    image_url = await image_locator.first.get_attribute("src")

                    link_locator = await produto.locator('a.a-link-normal.s-no-outline').get_attribute("href")

                    preco_atual_locator = produto.locator('.a-price:not(.a-text-price) .a-offscreen')
                    preco_atual = (
                        await preco_atual_locator.first.inner_text()
                        if await preco_atual_locator.count() > 0
                        else "Sem preço"
                    )

                    preco_antigo_locator = produto.locator('.a-price.a-text-price .a-offscreen')
                    preco_antigo = (
                        await preco_antigo_locator.first.inner_text()
                        if await preco_antigo_locator.count() > 0
                        else None
                    )           

                    # Extracao do SKU                          
                    decoded_link = unquote(link_locator)
                    match = re.search(r'/dp/(\w+)', decoded_link)
                    sku = match.group(1) if match else "Não encontrado"

                    dados_item = {
                        "SKU" : sku,
                        "img" : image_url,
                        "nome" : name,
                        "de" : preco_antigo,
                        "por" : preco_atual,
                        "link" : "https://www.amazon.com.br" + link_locator
                    }

                    salvar_no_banco(dados_item)

                except Exception as erro:
                    print(f"Erro ao encontrar produtos: {erro}")

            next_button = page.locator('a.s-pagination-next')

            await next_button.click()
            pagina += 1
        
            time.sleep(2)

            if pagina > 10:
                await browser.close()
                break
        
            
