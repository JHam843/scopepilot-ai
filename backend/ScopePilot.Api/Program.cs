using Microsoft.EntityFrameworkCore;
using ScopePilot.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var databasePath = Path.Combine(
    builder.Environment.ContentRootPath,
    "scopepilot.db");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}"));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

app.MapGet("/", () => new
{
    application = "ScopePilot API",
    status = "running"
});

app.MapControllers();

app.Run();