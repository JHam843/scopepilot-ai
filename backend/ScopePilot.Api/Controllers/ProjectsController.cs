using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScopePilot.Api.Contracts;
using ScopePilot.Api.Data;
using ScopePilot.Api.Models;

namespace ScopePilot.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProjectsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<ScopeProject>>> GetAll()
    {
        var projects = await _db.Projects
            .AsNoTracking()
            .OrderByDescending(project => project.UpdatedAtUtc)
            .ToListAsync();

        return Ok(projects);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ScopeProject>> GetById(Guid id)
    {
        var project = await _db.Projects.FindAsync(id);

        if (project is null)
        {
            return NotFound();
        }

        return Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<ScopeProject>> Create(
        SaveProjectRequest request)
    {
        var project = new ScopeProject
        {
            Title = request.Title,
            ClientName = request.ClientName,
            RawRequest = request.RawRequest,
            Status = request.Status
        };

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = project.Id },
            project);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        SaveProjectRequest request)
    {
        var project = await _db.Projects.FindAsync(id);

        if (project is null)
        {
            return NotFound();
        }

        project.Title = request.Title;
        project.ClientName = request.ClientName;
        project.RawRequest = request.RawRequest;
        project.Status = request.Status;
        project.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
    }
}