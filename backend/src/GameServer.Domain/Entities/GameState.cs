using GameServer.Domain.Enums;

namespace GameServer.Domain.Entities;

/// <summary>
/// Represents the complete state of a game session.
/// This replaces all the scattered 'let' variables from the original server.js.
/// </summary>
public class GameState
{
    private readonly object _lock = new();

    private List<Message> _messages = new();
    private string? _participantName;
    private string? _confederateName;
    private int _currentScore;
    private int _interruptCount;
    private int? _currentBlockIndex;
    private int? _currentProblemIndex;
    private bool _isLive;
    private ChimesConfig? _chimesConfig;
    private GameResolutionType? _pendingResolutionType;
    private string? _teamAnswer;

    public List<Message> Messages
    {
        get { lock (_lock) { return _messages; } }
        private set { _messages = value; }
    }

    public string? ParticipantName
    {
        get { lock (_lock) { return _participantName; } }
        set { lock (_lock) { _participantName = value; } }
    }

    public string? ConfederateName
    {
        get { lock (_lock) { return _confederateName; } }
        set { lock (_lock) { _confederateName = value; } }
    }

    public int CurrentScore
    {
        get { lock (_lock) { return _currentScore; } }
        private set { _currentScore = value; }
    }

    public int? CurrentBlockIndex
    {
        get { lock (_lock) { return _currentBlockIndex; } }
        private set { _currentBlockIndex = value; }
    }

    public int? CurrentProblemIndex
    {
        get { lock (_lock) { return _currentProblemIndex; } }
        private set { _currentProblemIndex = value; }
    }

    public bool IsLive
    {
        get { lock (_lock) { return _isLive; } }
        private set { _isLive = value; }
    }

    public ChimesConfig? ChimesConfig
    {
        get { lock (_lock) { return _chimesConfig; } }
        set { lock (_lock) { _chimesConfig = value; } }
    }

    public GameResolutionType? PendingResolutionType
    {
        get { lock (_lock) { return _pendingResolutionType; } }
        set { lock (_lock) { _pendingResolutionType = value; } }
    }

    public string? TeamAnswer
    {
        get { lock (_lock) { return _teamAnswer; } }
        set { lock (_lock) { _teamAnswer = value; } }
    }

    /// <summary>
    /// Adds a message to the chat history.
    /// </summary>
    public void AddMessage(Message message)
    {
        lock (_lock)
        {
            Messages.Add(message);
        }
    }

    /// <summary>
    /// Clears all messages and returns them for logging.
    /// </summary>
    public IReadOnlyList<Message> ClearMessages()
    {
        lock (_lock)
        {
            var messages = Messages.ToList();
            Messages = new List<Message>();
            return messages;
        }
    }

    /// <summary>
    /// Starts the game session.
    /// </summary>
    public void Start()
    {
        lock (_lock) { _isLive = true; }
    }

    /// <summary>
    /// Stops the game session.
    /// </summary>
    public void Stop()
    {
        lock (_lock) { _isLive = false; }
    }

    /// <summary>
    /// Sets the current problem selection.
    /// </summary>
    public void SetProblemSelection(int blockIndex, int problemIndex)
    {
        lock (_lock)
        {
            _currentBlockIndex = blockIndex;
            _currentProblemIndex = problemIndex;
        }
    }

    /// <summary>
    /// Moves to the first block.
    /// </summary>
    public void FirstBlock()
    {
        lock (_lock)
        {
            _currentBlockIndex = 0;
            _currentProblemIndex = 0;
        }
    }

    /// <summary>
    /// Moves to the next block.
    /// </summary>
    public void NextBlock()
    {
        lock (_lock)
        {
            _currentBlockIndex = _currentBlockIndex >= 0 ? _currentBlockIndex + 1 : 0;
            _currentProblemIndex = 0;
        }
    }

    /// <summary>
    /// Moves to the next problem within the current block.
    /// </summary>
    /// <param name="maxProblems">Maximum number of problems in a block (default 5).</param>
    public void NextProblem(int maxProblems = 5)
    {
        lock (_lock)
        {
            if (_currentProblemIndex.HasValue && _currentProblemIndex < maxProblems - 1)
                _currentProblemIndex++;
            else
                _currentProblemIndex = 0;
        }
    }

    /// <summary>
    /// Awards points to the current score.
    /// </summary>
    public void AwardPoints(int points)
    {
        lock (_lock)
        {
            _currentScore += points;
        }
    }

    /// <summary>
    /// Increments the interrupt count by one.
    /// </summary>
    public void IncrementInterruptCount()
    {
        lock (_lock)
        {
            _interruptCount++;
        }
    }

    /// <summary>
    /// Returns the current interrupt count and resets it to zero.
    /// </summary>
    public int GetAndResetInterruptCount()
    {
        lock (_lock)
        {
            var count = _interruptCount;
            _interruptCount = 0;
            return count;
        }
    }

    /// <summary>
    /// Atomically checks whether the pending resolution matches the given values.
    /// </summary>
    public bool MatchesPendingResolution(GameResolutionType type, string? answer)
    {
        lock (_lock) { return _pendingResolutionType == type && _teamAnswer == answer; }
    }

    /// <summary>
    /// Atomically sets both the pending resolution type and team answer.
    /// </summary>
    public void SetPendingResolution(GameResolutionType type, string? answer)
    {
        lock (_lock)
        {
            _pendingResolutionType = type;
            _teamAnswer = answer;
        }
    }

    /// <summary>
    /// Resets the score to zero.
    /// </summary>
    public void ResetScore()
    {
        lock (_lock)
        {
            _currentScore = 0;
        }
    }

    /// <summary>
    /// Resets the entire game state to initial values.
    /// </summary>
    public void Reset()
    {
        lock (_lock)
        {
            _messages = new List<Message>();
            _participantName = null;
            _confederateName = null;
            _currentScore = 0;
            _interruptCount = 0;
            _currentBlockIndex = null;
            _currentProblemIndex = null;
            _isLive = false;
            _chimesConfig = null;
            _pendingResolutionType = null;
            _teamAnswer = null;
        }
    }
}
