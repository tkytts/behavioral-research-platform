using GameServer.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace GameServer.Application.Services;

/// <summary>
/// Manages the countdown timer for game rounds.
/// </summary>
public class TimerService : ITimerService, IDisposable
{
    private readonly object _lock = new();
    private Timer? _timer;
    private int _countdown;
    private int _maxTime;
    private bool _isRunning;

    public TimerService(IOptions<GameSettings> settings)
    {
        _maxTime = settings.Value.MaxTime;
        _countdown = _maxTime;
    }

    public int CurrentCountdown => _countdown;
    public int MaxTime
    {
        get => _maxTime;
        set
        {
            lock (_lock)
            {
                _maxTime = value;
                Stop();
                _countdown = _maxTime;
            }
        }
    }
    public bool IsRunning => _isRunning;

    public event Action<int>? OnTick;
    public event Action? OnTimeout;

    public void Start()
    {
        lock (_lock)
        {
            if (_isRunning) return;

            _countdown = _maxTime;
            _isRunning = true;

            _timer = new Timer(
                callback: _ => Tick(),
                state: null,
                dueTime: TimeSpan.FromSeconds(1),
                period: TimeSpan.FromSeconds(1));
        }
    }

    public void Stop()
    {
        lock (_lock)
        {
            _timer?.Dispose();
            _timer = null;
            _isRunning = false;
        }
    }

    public void Reset()
    {
        lock (_lock)
        {
            _countdown = _maxTime;
            OnTick?.Invoke(_countdown);
        }
    }

    private void Tick()
    {
        bool timedOut = false;
        int countdown;

        lock (_lock)
        {
            if (!_isRunning) return;

            _countdown--;
            countdown = _countdown;

            if (_countdown <= 0)
            {
                _timer?.Dispose();
                _timer = null;
                _isRunning = false;
                timedOut = true;
            }
        }

        OnTick?.Invoke(countdown);

        if (timedOut)
            OnTimeout?.Invoke();
    }

    public void Dispose()
    {
        _timer?.Dispose();
        GC.SuppressFinalize(this);
    }
}
