import { useTranslation } from "react-i18next";
import {
  setConfederate,
  tutorialProblem,
  startTimer,
  stopTimer,
  typing,
  sendMessage,
  setAnswer,
  setGameResolution,
  setMaxTime,
  resetPoints,
  clearChat,
} from "../realtime/game";
import { RESOLUTION_TYPES } from "../constants/resolutionTypes";
import { typeMessage } from "../utils/typeMessage";

function useTutorialSimulations({
  activeTimersRef,
  readyButtonRef,
  messageRef,
  sendButtonRef,
  currentUserRef,
  setCurrentUser,
  setCurrentTutorialStep,
  setShowMessageBox,
  setMessageInputStyle,
  setNewMessage,
}) {
  const { t } = useTranslation();

  const safeTimeout = (fn, delay) => {
    const id = setTimeout(fn, delay);
    activeTimersRef.current.push({ type: "timeout", id });
    return id;
  };

  const clearAllTimers = () => {
    activeTimersRef.current.forEach(({ type, id }) => {
      if (type === "timeout") clearTimeout(id);
      else clearInterval(id);
    });
    activeTimersRef.current = [];
  };

  const handleTutorialMessage = (message) => {
    setShowMessageBox(true);
    const inputPosition = messageRef.current.getBoundingClientRect();

    setMessageInputStyle({
      position: "absolute",
      top: inputPosition.top,
      left: inputPosition.left,
      width: inputPosition.width,
      height: inputPosition.height,
    });

    const intervalId = typeMessage(message, {
      delay: 100,
      onCharacter: (partial) => setNewMessage(partial),
      onComplete: () => {
        safeTimeout(() => {
          sendButtonRef.current?.classList.add("click-animation");
          safeTimeout(() => {
            sendButtonRef.current?.classList.remove("click-animation");
            setShowMessageBox(false);
            sendMessage({
              user: currentUserRef.current,
              text: message,
              timeStamp: new Date().toISOString(),
            });
            try {
              new Audio("/sounds/message-sent.mp3").play();
            } catch (error) {
              console.error("Failed to play audio:", error);
            }
          }, 500);
        }, 1000);
      },
    });
    activeTimersRef.current.push({ type: "interval", id: intervalId });
  };

  const handleSimulation1 = () => {
    const simulationConfederate = t("tutorial_confederate_1");
    setCurrentTutorialStep(11);
    setConfederate(simulationConfederate);
    setCurrentUser(t("tutorial_participant_1"));
    tutorialProblem({ block: { name: "T_1" }, problem: "1" });

    safeTimeout(() => {
      readyButtonRef.current.classList.add("click-animation");

      safeTimeout(() => {
        readyButtonRef.current.classList.remove("click-animation");
        safeTimeout(() => {
          setCurrentTutorialStep(12);
        }, 200);

        startTimer();

        safeTimeout(() => {
          typing(simulationConfederate);
          safeTimeout(() => {
            sendMessage({
              user: simulationConfederate,
              text: t("what_do_you_think"),
              timeStamp: new Date().toISOString(),
            });
            stopTimer();
            safeTimeout(() => {
              setCurrentTutorialStep(13);
            }, 2000);
          }, 1000);
        }, 2800);
      }, 500);
    }, 2000);
  };

  const handleTutorialStep13 = () => {
    const simulationConfederate = t("tutorial_confederate_1");
    setMaxTime(70);
    startTimer();
    setCurrentTutorialStep(14);
    handleTutorialMessage(t("the_answer_is_triangle"));

    safeTimeout(() => {
      typing(simulationConfederate);
      setMaxTime(33);
      startTimer();
      safeTimeout(() => {
        sendMessage({
          user: simulationConfederate,
          text: t("yes_i_think_you_are_right"),
          timeStamp: new Date().toISOString(),
        });

        safeTimeout(() => {
          setAnswer(t("triangle"));
          setGameResolution({ gameResolutionType: RESOLUTION_TYPES.AP, teamAnswer: t("triangle") });
          setMaxTime(11);
          startTimer();

          safeTimeout(() => {
            setCurrentTutorialStep(15);
          }, 25000);
        }, 3000);
      }, 3000);
    }, 5000);
  };

  const handleSimulation2 = () => {
    setAnswer("");
    resetPoints();
    clearChat();
    setMaxTime(75);
    const simulationConfederate = t("tutorial_confederate_2");
    setCurrentTutorialStep(16);
    setConfederate(simulationConfederate);
    setCurrentUser(t("tutorial_participant_2"));
    tutorialProblem({ block: { name: "T_1" }, problem: "2" });

    safeTimeout(() => {
      readyButtonRef.current.classList.add("click-animation");

      safeTimeout(() => {
        readyButtonRef.current.classList.remove("click-animation");
        safeTimeout(() => {
          setCurrentTutorialStep(12);
        }, 200);

        startTimer();

        safeTimeout(() => {
          typing(simulationConfederate);
          safeTimeout(() => {
            sendMessage({
              user: simulationConfederate,
              text: t("which_option"),
              timeStamp: new Date().toISOString(),
            });
            stopTimer();
            safeTimeout(() => {
              setCurrentTutorialStep(17);
            }, 2000);
          }, 1000);
        }, 2800);
      }, 500);
    }, 2000);
  };

  const handleTutorialStep17 = () => {
    const simulationConfederate = t("tutorial_confederate_2");
    setMaxTime(70);
    startTimer();
    setCurrentTutorialStep(18);
    handleTutorialMessage(t("i_think_the_answer_is_11"));

    safeTimeout(() => {
      typing(simulationConfederate);
      setMaxTime(33);
      startTimer();
      safeTimeout(() => {
        sendMessage({
          user: simulationConfederate,
          text: t("i_disagree_i_think_its_12"),
          timeStamp: new Date().toISOString(),
        });

        safeTimeout(() => {
          setAnswer("12");
          setGameResolution({ gameResolutionType: RESOLUTION_TYPES.DNP, teamAnswer: "12" });
          setMaxTime(11);
          startTimer();

          safeTimeout(() => {
            setCurrentTutorialStep(19);
          }, 25000);
        }, 3000);
      }, 3000);
    }, 5000);
  };

  const handleSimulation3 = () => {
    clearChat();
    setMaxTime(75);
    const simulationConfederate = t("tutorial_confederate_3");
    setCurrentTutorialStep(20);
    setConfederate(simulationConfederate);
    setCurrentUser(t("tutorial_participant_3"));
    tutorialProblem({ block: { name: "T_1" }, problem: "3" });
  };

  const handleTutorialStep20 = () => {
    setCurrentTutorialStep(21);
    const simulationConfederate = t("tutorial_confederate_3");
    typing(simulationConfederate);
    safeTimeout(() => {
      typing(simulationConfederate);
      safeTimeout(() => {
        sendMessage({
          user: simulationConfederate,
          text: t("what_do_you_think"),
          timeStamp: new Date().toISOString(),
        });
        safeTimeout(() => {
          setCurrentTutorialStep(22);
        }, 2000);
      }, 1000);
    }, 2000);
  };

  return {
    safeTimeout,
    clearAllTimers,
    handleTutorialMessage,
    handleSimulation1,
    handleTutorialStep13,
    handleSimulation2,
    handleTutorialStep17,
    handleSimulation3,
    handleTutorialStep20,
  };
}

export default useTutorialSimulations;
