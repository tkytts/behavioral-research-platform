import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useChimesConfig } from "../context/ChimesConfigContext";
import {
  onTimerUpdate,
  offTimerUpdate,
  onSetAnswer,
  offSetAnswer,
  onGameResolved,
  offGameResolved,
  onProblemUpdate,
  offProblemUpdate,
  startTimer,
  stopTimer,
  resetTimer,
} from "../realtime/game";

function GameBox({ isAdmin, gamesRef, timerRef, pointsRef, teamAnswerRef, className }) {
  const { t } = useTranslation();
  const [currentProblem, setCurrentProblem] = useState(null);
  const [currentBlock, setCurrentBlock] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [teamAnswer, setTeamAnswer] = useState("");
  const [teamScore, setTeamScore] = useState(0);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [pointsAwarded, setPointsAwarded] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const { chimesConfig } = useChimesConfig();
  const countdownAudioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio("/sounds/countdown.mp3");
    audio.preload = "auto";
    countdownAudioRef.current = audio;
    return () => {
      audio.pause();
      countdownAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleUserInteraction = () => setUserInteracted(true);
    window.addEventListener("click", handleUserInteraction, { once: true });
    window.addEventListener("keydown", handleUserInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    const handleTimerUpdate = (newCountdown) => {
      setCountdown(newCountdown);
    };

    const handleSetAnswer = (answer) => {
      setTeamAnswer(answer);
    };

    const handleGameResolved = (resolution) => {
      setFinalAnswer("");
      setIsAnswerCorrect(null);
      setPointsAwarded(null);

      setTimeout(() => {
        setShowResults(true);
        setFinalAnswer(resolution.teamAnswer);

        setTimeout(() => {
          setIsAnswerCorrect(resolution.isAnswerCorrect);

          setTimeout(() => {
            setPointsAwarded(resolution.pointsAwarded);
            setTeamScore(resolution.currentScore);
          }, 3000);
        }, 3000);
      }, 3000);
    };

    const handleProblemUpdate = ({ block, problem }) => {
      setCurrentBlock(block);
      setCurrentProblem(problem);
      setShowResults(false);
    };

    onTimerUpdate(handleTimerUpdate);
    onSetAnswer(handleSetAnswer);
    onGameResolved(handleGameResolved);
    onProblemUpdate(handleProblemUpdate);

    return () => {
      offTimerUpdate(handleTimerUpdate);
      offSetAnswer(handleSetAnswer);
      offGameResolved(handleGameResolved);
      offProblemUpdate(handleProblemUpdate);
    };
  }, []);

  useEffect(() => {
    if (chimesConfig?.timer && userInteracted) {
      const gameIsLive = currentBlock && currentProblem;
      if (gameIsLive && countdown <= 10) {
        countdownAudioRef.current.play().catch((error) => {
        });
      } else if (countdownAudioRef.current && !countdownAudioRef.current.paused) {
        countdownAudioRef.current.pause();
        countdownAudioRef.current.currentTime = 0;
      }
    }
  }, [countdown, chimesConfig, userInteracted, currentBlock, currentProblem]);

  const handleStartTimer = () => {
    startTimer();
  };

  const handleStopTimer = () => {
    stopTimer();
    if (countdownAudioRef.current) {
      countdownAudioRef.current.pause();
      countdownAudioRef.current.currentTime = 0;
    }
  };

  const handleResetTimer = () => {
    resetTimer();
    if (countdownAudioRef.current) {
      countdownAudioRef.current.pause();
      countdownAudioRef.current.currentTime = 0;
    }
  };

  return (
    <div className={className ?? "col-md-6"}>
      <div className="card">
        <div className="card-body">
          <p className="mb-3">{t("find_the_solution_to_the_problem")}:</p>
          <div className="fs-2 mb-3" ref={gamesRef}>
            {currentBlock && currentProblem ? (
              <img
                src={`/problems/${currentBlock.name}/${currentProblem}.png`}
                alt={t("problem")}
                className="img-fluid"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            ) : (
              t("loading_problem")
            )}
          </div>
          {showResults && (
            <p className="mb-1">
              <b>
                {t("team_answer_was")} {finalAnswer}
              </b>
            </p>
          )}
          {showResults && isAnswerCorrect != null && (
            <p className="mb-1">
              <b>
                {t("the_answer_was")}{" "}
                {isAnswerCorrect ? t("correct") : t("incorrect")}
              </b>
            </p>
          )}
          {showResults && pointsAwarded != null && (
            <p className="mb-1">
              <b>{t("you_earned_points", { count: pointsAwarded })}</b>
            </p>
          )}
          <p
            className={`mt-3 ${
              countdown === 0 ? "text-danger" : ""
            } ${countdown !== null && countdown <= 10 ? "flash-red" : ""}`}
            ref={timerRef}
          >
            {countdown === null ? null : countdown > 0 ? (
              countdown === 1
                ? t("1_second_left")
                : t("n_seconds_left", { count: countdown })
            ) : (
              <b>{t("time_is_up")}</b>
            )}
          </p>
          <p className="mb-1" ref={teamAnswerRef}>
            <b>{t("team_answer")}:</b> {teamAnswer}
          </p>
          <p className="mb-1" ref={pointsRef}>
            <b>{t("points")}:</b> {teamScore}
          </p>

          {isAdmin && (
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-primary" onClick={handleStartTimer}>
                {t("start_timer")}
              </button>
              <button className="btn btn-danger" onClick={handleStopTimer}>
                {t("stop_timer")}
              </button>
              <button className="btn btn-secondary" onClick={handleResetTimer}>
                {t("reset_timer")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameBox;