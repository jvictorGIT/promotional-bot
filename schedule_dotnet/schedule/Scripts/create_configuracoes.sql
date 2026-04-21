IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Configuracoes')
BEGIN
    CREATE TABLE Configuracoes (
        Chave VARCHAR(100) NOT NULL PRIMARY KEY,
        Valor VARCHAR(100) NOT NULL
    );

    INSERT INTO Configuracoes (Chave, Valor) VALUES ('threshold_percentual', '0.50');
END
