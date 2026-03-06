import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";

import {
  onStatusUpdate,
  offStatusUpdate,
  onReceiveMessage,
  offReceiveMessage,
  setMaxTime,
  setChimes,
  setConfederate,
  tutorialProblem,
  startTimer,
  stopTimer,
  typing,
  sendMessage,
  setAnswer,
  setGameResolution,
  resetPoints,
  clearChat,
  tutorialDone
} from "../realtime/game";
import { RESOLUTION_TYPES } from "../constants/resolutionTypes";
import ChatBox from "../components/ChatBox";
import GameBox from "../components/GameBox";
import Modal from "../components/Modal";
import InputModal from "../components/InputModal";

function Tutorial() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState("");
  const [isUsernameInitialized, setIsUsernameInitialized] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [isIncorrectAnswer, setIsIncorrectAnswer] = useState(false);
  const [typedMessage, setTypedMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [messageInputStyle, setMessageInputStyle] = useState(null);
  const [numTries, setNumTries] = useState(1);
  const currentUserRef = useRef("");
  const messageRef = useRef(null);
  const sendButtonRef = useRef(null);
  const chatRef = useRef(null);
  const confederateNameRef = useRef(null);
  const activityRef = useRef(null);
  const gamesRef = useRef(null);
  const timerRef = useRef(null);
  const pointsRef = useRef(null);
  const teamAnswerRef = useRef(null);
  const readyButtonRef = useRef(null);
  const activeTimersRef = useRef([]);
  const { t } = useTranslation();

  const safeTimeout = (fn, delay) => {
    const id = setTimeout(fn, delay);
    activeTimersRef.current.push({ type: "timeout", id });
    return id;
  };

  const safeInterval = (fn, delay) => {
    const id = setInterval(fn, delay);
    activeTimersRef.current.push({ type: "interval", id });
    return id;
  };

  const clearAllTimers = () => {
    activeTimersRef.current.forEach(({ type, id }) => {
      if (type === "timeout") clearTimeout(id);
      else clearInterval(id);
    });
    activeTimersRef.current = [];
  };

  useEffect(() => {
    currentUserRef.current = currentUser;

    const handleStatus = (isLive) => {
      if (isLive) {
        clearAllTimers();
        navigate("/participant");
      }
    };

    onStatusUpdate(handleStatus);

    return () => {
      offStatusUpdate(handleStatus);
      clearAllTimers();
    };
  }, [currentUser, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTutorialStep1 = () => {
    setCurrentUser(t("your_name"));
    setIsUsernameInitialized(true);
    setMaxTime(75);
    setCurrentTutorialStep(1);

    setChimes({
      messageSent: true,
      messageReceived: true,
      timer: true
    });
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
              timeStamp: new Date().toISOString()
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
          timeStamp: new Date().toISOString()
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
              timeStamp: new Date().toISOString()
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
          timeStamp: new Date().toISOString()
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
          timeStamp: new Date().toISOString()
        });
        safeTimeout(() => {
          setCurrentTutorialStep(22);
        }, 2000);
      }, 1000);
    }, 2000);
  };

  const handleTutorialStep24 = () => {
    tutorialDone(numTries);
    setCurrentTutorialStep(25);
  };

  useEffect(() => {
    const pattern =
      currentTutorialStep >= 22
        ? new RegExp(
            "^" + t("arrow_up_green_pattern").replace(/\s+/g, "\\s*") + "$",
            "i"
          )
        : null;

    const handleMessage = (message) => {
      if (currentTutorialStep === 23 && pattern) {
        const received = message.text.trim();
        if (pattern.test(received)) {
          setIsIncorrectAnswer(false);
          setCurrentTutorialStep(24);
        } else {
          setNumTries(numTries + 1);
          setTypedMessage(message.text);
          setIsIncorrectAnswer(true);
          setCurrentTutorialStep(22);
        }
      }
    };

    onReceiveMessage(handleMessage);

    return () => {
      offReceiveMessage(handleMessage);
    };
  }, [currentTutorialStep, numTries, t]);

  const handleTutorialMessage = (message) => {
    setShowMessageBox(true);
    const inputPosition = messageRef.current.getBoundingClientRect();

    setMessageInputStyle({
      position: "absolute",
      top: inputPosition.top,
      left: inputPosition.left,
      width: inputPosition.width,
      height: inputPosition.height
    });

    typeMessage(message);
  };

  function typeMessage(originalMessage, delay = 100) {
    let newMsg = "";
    const characters = originalMessage.split("");
    let index = 0;

    const intervalId = safeInterval(() => {
      newMsg += characters[index];
      setNewMessage(newMsg);

      index++;

      if (index >= characters.length) {
        clearInterval(intervalId);

        safeTimeout(() => {
          if (sendButtonRef.current) {
            sendButtonRef.current.classList.add("click-animation");
          }

          safeTimeout(() => {
            if (sendButtonRef.current) {
              sendButtonRef.current.classList.remove("click-animation");
            }
            setShowMessageBox(false);
            sendMessage({
              user: currentUserRef.current,
              text: originalMessage,
              timeStamp: new Date().toISOString()
            });
            try {
              new Audio("/sounds/message-sent.mp3").play();
            } catch (error) {
              console.error("Failed to play audio:", error);
            }
          }, 500);
        }, 1000);
      }
    }, delay);
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">{t("title")}</h1>
      {currentTutorialStep === 0 && (
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="mb-4">
              <p>{t("welcome")}</p>
              <Trans i18nKey="tutorial_intro" components={{ p: <p /> }} />
            </div>
            <div className="mb-4 text-center">
              <p>{t("start_tutorial")}</p>
              <button className="btn btn-primary btn-narrow" onClick={handleTutorialStep1}>
                {t("ready")}
              </button>
            </div>
          </div>
        </div>
      )}
      {currentTutorialStep === 1 && (
        <Modal>
          <p>{t("tutorial_step1")}</p>
          <button
            className="btn btn-primary btn-narrow"
            style={{ minWidth: "120px", width: "120px", textAlign: "center" }}
            onClick={() => setCurrentTutorialStep(2)}
          >
            {t("understood")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 2 && (
        <InputModal onUnderstood={() => setCurrentTutorialStep(3)} inputRef={messageRef?.current} text={t("inputmodal_2")} />
      )}
      {currentTutorialStep === 3 && (
        <InputModal onUnderstood={() => setCurrentTutorialStep(4)} inputRef={chatRef?.current} text={t("inputmodal_3")} />
      )}
      {currentTutorialStep === 4 && (
        <InputModal onUnderstood={() => setCurrentTutorialStep(5)} inputRef={confederateNameRef?.current} text={t("inputmodal_4")} />
      )}
      {currentTutorialStep === 5 && (
        <InputModal onUnderstood={() => setCurrentTutorialStep(6)} inputRef={activityRef?.current} text={t("inputmodal_5")} />
      )}
      {currentTutorialStep === 6 && (
        <InputModal onUnderstood={() => setCurrentTutorialStep(7)} inputRef={gamesRef?.current} text={t("inputmodal_6")} />
      )}
      {currentTutorialStep === 7 && (
        <InputModal onUnderstood={() => setCurrentTutorialStep(8)} inputRef={timerRef?.current} text={t("inputmodal_7")} />
      )}
      {currentTutorialStep === 8 && (
        <InputModal onUnderstood={() => setCurrentTutorialStep(9)} inputRef={pointsRef?.current} text={t("inputmodal_8")} />
      )}
      {currentTutorialStep === 9 && (
        <InputModal onUnderstood={() => setCurrentTutorialStep(10)} inputRef={teamAnswerRef?.current} text={t("inputmodal_9")} />
      )}
      {currentTutorialStep === 10 && (
        <Modal>
          <p>{t("tutorial_step10")}</p>
          <button
            className="btn btn-primary btn-narrow"
            style={{ minWidth: "120px", width: "120px", textAlign: "center" }}
            onClick={() => handleSimulation1()}
          >
            {t("understood")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 11 && (
        <Modal>
          <p>{t("playing_with")}</p>
          <p className="h2">
            <b>{t("tutorial_confederate_1")}</b>
          </p>
          <button ref={readyButtonRef} className="btn btn-primary btn-narrow button-dead">
            {t("ready")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 13 && (
        <Modal>
          <p>{t("tutorial_step13")}</p>
          <button
            className="btn btn-primary btn-narrow"
            style={{ minWidth: "120px", width: "120px", textAlign: "center" }}
            onClick={() => handleTutorialStep13()}
          >
            {t("understood")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 15 && (
        <Modal>
          <p>{t("tutorial_step15")}</p>
          <button
            className="btn btn-primary btn-narrow"
            style={{ minWidth: "120px", width: "120px", textAlign: "center" }}
            onClick={() => handleSimulation2()}
          >
            {t("understood")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 16 && (
        <Modal>
          <p>{t("playing_with")}</p>
          <p className="h2">
            <b>{t("tutorial_confederate_2")}</b>
          </p>
          <button ref={readyButtonRef} className="btn btn-primary btn-narrow button-dead">
            {t("ready")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 17 && (
        <Modal>
          <p>{t("tutorial_step17")}</p>
          <button
            className="btn btn-primary btn-narrow"
            style={{ minWidth: "120px", width: "120px", textAlign: "center" }}
            onClick={() => handleTutorialStep17()}
          >
            {t("understood")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 19 && (
        <Modal>
          <p>{t("tutorial_step19")}</p>
          <button
            className="btn btn-primary btn-narrow"
            style={{ minWidth: "120px", width: "120px", textAlign: "center" }}
            onClick={() => handleSimulation3()}
          >
            {t("ready")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 20 && (
        <Modal>
          <p>{t("tutorial_step20_1")}</p>
          <p>{t("tutorial_step20_2")}</p>
          <p className="h2">
            <b>{t("tutorial_confederate_3")}</b>
          </p>
          <p>{t("tutorial_step20_3")}</p>
          <button onClick={() => handleTutorialStep20()} className="btn btn-primary btn-narrow">
            {t("ready")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 22 && !isIncorrectAnswer && (
        <Modal>
          <p>{t("tutorial_step22")}</p>
          <button
            className="btn btn-primary btn-narrow"
            style={{ minWidth: "120px", width: "120px", textAlign: "center" }}
            onClick={() => setCurrentTutorialStep(23)}
          >
            {t("understood")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 22 && isIncorrectAnswer && (
        <Modal>
          <Trans i18nKey="tutorial_step22_wrong" values={{ typedMessage }} components={{ b: <b /> }} />
          <button
            className="btn btn-primary btn-narrow"
            style={{ minWidth: "120px", width: "120px", textAlign: "center" }}
            onClick={() => setIsIncorrectAnswer(false)}
          >
            {t("understood")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 24 && (
        <Modal>
          <p>{t("excellent")}</p>
          <button
            className="btn btn-primary btn-narrow"
            style={{ minWidth: "120px", width: "120px", textAlign: "center" }}
            onClick={() => handleTutorialStep24()}
          >
            {t("thanks")}
          </button>
        </Modal>
      )}
      {currentTutorialStep === 25 && (
        <Modal>
          <p>{t("tutorial_step25")}</p>
        </Modal>
      )}
      {isUsernameInitialized && (
        <div className="row">
          <ChatBox
            currentUser={currentUser}
            isAdmin={false}
            messageRef={messageRef}
            chatRef={chatRef}
            confederateNameRef={confederateNameRef}
            activityRef={activityRef}
            sendButtonRef={sendButtonRef}
            disabled={currentTutorialStep < 23}
          />
          <GameBox isAdmin={false} gamesRef={gamesRef} timerRef={timerRef} pointsRef={pointsRef} teamAnswerRef={teamAnswerRef} />
          {showMessageBox && (
            <input type="text" className="form-control me-2" placeholder={t("message_placeholder")} value={newMessage} style={messageInputStyle} />
          )}
        </div>
      )}
    </div>
  );
}

export default Tutorial;