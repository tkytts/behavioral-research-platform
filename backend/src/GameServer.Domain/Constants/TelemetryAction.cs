namespace GameServer.Domain.Constants;

public static class TelemetryAction
{
    public const string Edit               = "edit";
    public const string MessageSent        = "message sent";
    public const string Interrupt          = "INTERRUPT";
    public const string BlockInterrupts    = "BLOCK_INTERRUPTS";
    public const string ConfederateMessage = "CONFEDERATE MESSAGE";
    public const string NextProblem        = "next problem";
    public const string NewGame            = "NEW GAME";
    public const string GameResolved       = "game resolved";
    public const string TeamAnswerSet           = "TEAM_ANSWER_SET";
    public const string StartingProblemOverride = "STARTING_PROBLEM_OVERRIDE";
}
