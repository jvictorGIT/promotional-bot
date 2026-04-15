import pyodbc
import re

def limpar_preco(preco_str):

    if not preco_str or preco_str.strip() == "":
        return 0.0

    apenas_numeros = re.sub(r'[^\d,]', '', preco_str)
    
    if not apenas_numeros:
        return 0.0
        
    try:
        return float(apenas_numeros.replace(',', '.'))
    except ValueError:
        return 0.0

def salvar_no_banco(dados_item):
    conn_str = (
        'Driver={ODBC Driver 18 for SQL Server};'
        'Server=localhost;'
        'Database=Sales_Bot;'
        'UID=sa;'
        'PWD=!Jvictor22;' 
        'TrustServerCertificate=yes;'
    )
    
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        # 1. Verifica se o SKU já existe
        cursor.execute("SELECT COUNT(*) FROM Promocoes WHERE Sku = ?", (dados_item['SKU'],))
        existe = cursor.fetchone()[0]

        if existe > 0:                                                                                                                                                                              
            preco_de = limpar_preco(dados_item['de'])
            preco_por = limpar_preco(dados_item['por'])                                                                                                                                             
                        
            if preco_de == 0.0 or preco_por == 0.0:                                                                                                                                                 
                print(f"⚠️  SKU {dados_item['SKU']} ignorado (preço inválido)")
                return                                                                                                                                                                              
        
            cursor.execute("""                                                                                                                                                                      
                UPDATE Promocoes
                SET Name = ?, PriceDe = ?, PricePor = ?, Link = ?, Status = 'Pending', Percentual = 0
                WHERE Sku = ?                                                                                                                                                                       
            """, (dados_item['nome'], preco_de, preco_por, dados_item['link'], dados_item['SKU']))
                                                                                                                                                                                                    
            conn.commit()
            print(f"🔄 SKU {dados_item['SKU']}:{dados_item['nome'][:30]} atualizado → Pending")                                                                                                     
            return 

        sql_insert = """
            INSERT INTO Promocoes (Sku, Name, PriceDe, PricePor, Link, Status)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        
        preco_de = limpar_preco(dados_item['de'])
        preco_por = limpar_preco(dados_item['por'])

        if preco_de == 0.0 or preco_por == 0.0:
            print(f"⚠️ Produto ignorado (preço inválido): {dados_item['nome']}")
            return

        cursor.execute(sql_insert, (
            dados_item['SKU'],   
            dados_item['nome'], 
            preco_de, 
            preco_por,   
            dados_item['link'],
            'Pending' 
        ))
        
        conn.commit() 
        print(f"✅ {dados_item['nome'][:30]}... inserido!")

    except Exception as e:
        print(f"❌ Erro ao inserir no banco: {e}")
    
    finally:
        if 'conn' in locals():
            conn.close()

