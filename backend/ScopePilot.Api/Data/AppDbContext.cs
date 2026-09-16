using Microsoft.EntityFrameworkCore;
using ScopePilot.Api.Models;

namespace ScopePilot.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<ScopeProject> Projects => Set<ScopeProject>();
}