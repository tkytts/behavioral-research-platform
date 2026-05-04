# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/GameServer.Api/GameServer.Api.csproj", "src/GameServer.Api/"]
COPY ["src/GameServer.Application/GameServer.Application.csproj", "src/GameServer.Application/"]
COPY ["src/GameServer.Domain/GameServer.Domain.csproj", "src/GameServer.Domain/"]
COPY ["src/GameServer.Infrastructure/GameServer.Infrastructure.csproj", "src/GameServer.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "src/GameServer.Api/GameServer.Api.csproj"

# Copy all source files
COPY . .

# Build
WORKDIR "/src/src/GameServer.Api"
RUN dotnet build "GameServer.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "GameServer.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN adduser --disabled-password --gecos "" appuser
WORKDIR /app
EXPOSE 8080
COPY --from=publish /app/publish .
USER appuser
ENTRYPOINT ["dotnet", "GameServer.Api.dll"]
