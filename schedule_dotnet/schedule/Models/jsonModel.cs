public class jsonModel
{
    public int Id { get; set; }
    public string? Sku { get; set; }
    public string? Name { get; set; }
    public decimal PriceDe { get; set; } // O preço "De"
    public decimal PricePor { get; set; }   // O preço "Por"
    public string? Link { get; set; }
    public string? ImageUrl { get; set; }
    public string? Status { get; set; }     // "Pending", "Approved", "LowDiscount"
    public decimal Percentual { get; set; }
}