using System.ComponentModel.DataAnnotations;

namespace ScopePilot.Api.Contracts;

public class SaveProjectRequest
{
    [Required]
    [StringLength(120, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string ClientName { get; set; } = string.Empty;

    [Required]
    [StringLength(6000, MinimumLength = 10)]
    public string RawRequest { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(Draft|InReview|Final)$")]
    public string Status { get; set; } = "Draft";
}