using GameServer.Api.Hubs;
using GameServer.Api.Services;
using GameServer.Application;
using GameServer.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add SignalR
builder.Services.AddSignalR();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                ?? new[] { "http://localhost:3000" })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Configure game settings
builder.Services.Configure<GameSettings>(
    builder.Configuration.GetSection(GameSettings.SectionName));

// Configure feature settings
builder.Services.AddOptions<FeatureSettings>()
    .Bind(builder.Configuration.GetSection(FeatureSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Add application and infrastructure services
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Environment.ContentRootPath);
builder.Services.AddHostedService<TimerBroadcastService>();
builder.WebHost.UseUrls(Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://localhost:5000");

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors();
app.UseWebSockets();

app.MapControllers();
app.MapHub<GameHub>("/api/gamehub");

app.Run();

// Make Program class accessible for integration tests
public partial class Program { }
