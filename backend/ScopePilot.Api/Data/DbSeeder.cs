using Microsoft.EntityFrameworkCore;
using ScopePilot.Api.Models;

namespace ScopePilot.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Projects.AnyAsync())
        {
            return;
        }

        db.Projects.AddRange(
            new ScopeProject
            {
                Title = "Barber booking platform",
                ClientName = "Downtown Barber",
                RawRequest = "Customers should book appointments online and choose a barber."
            },
            new ScopeProject
            {
                Title = "Supplier approval portal",
                ClientName = "Acme Supplies",
                RawRequest = "Employees should submit suppliers for manager approval."
            },
            new ScopeProject
            {
                Title = "Small-business inventory app",
                ClientName = "Corner Shop",
                RawRequest = "Staff should track products, stock changes, and low inventory."
            }
        );

        await db.SaveChangesAsync();
    }
}