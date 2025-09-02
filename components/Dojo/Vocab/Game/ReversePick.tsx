'use client';
import clsx from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { CircleCheck } from 'lucide-react';
import { CircleX } from 'lucide-react';
import { Random } from 'random-js';
import { IWordObj } from '@/store/useVocabStore';
import { useCorrect, useError } from '@/lib/hooks/useAudio';
import { buttonBorderStyles } from '@/static/styles';
import GameIntel from '@/components/reusable/Game/GameIntel';
import { pickGameKeyMappings } from '@/lib/keyMappings';
import { useStopwatch } from 'react-timer-hook';
import useStats from '@/lib/hooks/useStats';
import useStatsStore from '@/store/useStatsStore';
import Stars from '@/components/reusable/Game/Stars';

const random = new Random();

const ReversePick = ({
  selectedWordObjs,
  isHidden,
}: {
  selectedWordObjs: IWordObj[];
  isHidden: boolean;
}) => {
  const score = useStatsStore(state => state.score);
  const setScore = useStatsStore(state => state.setScore);

  const speedStopwatch = useStopwatch({ autoStart: false });

  const {
    incrementCorrectAnswers,
    incrementWrongAnswers,
    addCharacterToHistory,
    addCorrectAnswerTime,
    incrementCharacterScore,
  } = useStats();

  const { playCorrect } = useCorrect();
  const { playErrorTwice } = useError();

  const [correctMeaning, setCorrectMeaning] = useState(
    selectedWordObjs[random.integer(0, selectedWordObjs.length - 1)].meanings[0]
  );

  const correctWord = selectedWordObjs.find(
    obj => obj.meanings[0] === correctMeaning
  )?.word;

  const incorrectWordObjs = selectedWordObjs.filter(
    currentWordObj => currentWordObj.meanings[0] !== correctMeaning
  );

  const randomIncorrectWords = incorrectWordObjs
    .map(currentIncorrectWordObj => currentIncorrectWordObj.word)
    .sort(() => random.real(0, 1) - 0.5)
    .slice(0, 2);

  const [shuffledWords, setShuffledWords] = useState(
    [correctWord, ...randomIncorrectWords].sort(
      () => random.real(0, 1) - 0.5
    ) as string[]
  );

  const [feedback, setFeedback] = useState(<>{'feedback ~'}</>);

  const [wrongSelectedAnswers, setWrongSelectedAnswers] = useState<string[]>(
    []
  );

  useEffect(() => {
    setShuffledWords(
      [correctWord, ...randomIncorrectWords].sort(
        () => random.real(0, 1) - 0.5
      ) as string[]
    );
  }, [correctMeaning]);

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const index = pickGameKeyMappings[event.code];
      if (index !== undefined && index < shuffledWords.length) {
        buttonRefs.current[index]?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isHidden) speedStopwatch.pause();
  }, [isHidden]);

  const handleOptionClick = (word: string) => {
    if (word === correctWord) {
      speedStopwatch.pause();
      addCorrectAnswerTime(speedStopwatch.totalMilliseconds / 1000);
      speedStopwatch.reset();
      playCorrect();
      addCharacterToHistory(correctMeaning);
      incrementCharacterScore(correctMeaning, 'correct');
      incrementCorrectAnswers();
      setScore(score + 1);

      let newRandomMeaning =
        selectedWordObjs[random.integer(0, selectedWordObjs.length - 1)]
          .meanings[0];

      while (newRandomMeaning === correctMeaning) {
        newRandomMeaning =
          selectedWordObjs[random.integer(0, selectedWordObjs.length - 1)]
            .meanings[0];
      }
      setCorrectMeaning(newRandomMeaning);
      setWrongSelectedAnswers([]);
      setFeedback(
        <>
          <span>{`${correctMeaning} = ${word} `}</span>
          <CircleCheck className="inline text-[var(--main-color)]" />
        </>
      );
    } else {
      setWrongSelectedAnswers([...wrongSelectedAnswers, word]);
      setFeedback(
        <>
          <span>{`${correctMeaning} ≠ ${word} `}</span>
          <CircleX className="inline text-[var(--main-color)]" />
        </>
      );
      playErrorTwice();

      incrementCharacterScore(correctMeaning, 'wrong');
      incrementWrongAnswers();
      if (score - 1 < 0) {
        setScore(0);
      } else {
        setScore(score - 1);
      }
    }
  };

  return (
    <div
      className={clsx(
        'flex flex-col gap-6  sm:gap-10 items-center w-full sm:w-4/5',
        isHidden ? 'hidden' : '',
        'max-md:mb-8'
      )}
    >
      <GameIntel
        feedback={feedback}
        gameMode="reverse pick"
      />
      <p className="text-4xl md:text-7xl text-center">{correctMeaning}</p>
      <div
        className={clsx(
          'flex flex-col w-full gap-6 md:gap-0 md:justify-evenly',
          'md:flex-row'
        )}
      >
        {shuffledWords.map((word, i) => (
          <button
            ref={elem => {
              buttonRefs.current[i] = elem;
            }}
            key={word + i}
            type="button"
            disabled={wrongSelectedAnswers.includes(word)}
            className={clsx(
              'text-4xl py-4 px-2 rounded-xl w-full md:w-1/4 flex flex-row justify-center items-center gap-1.5',
              buttonBorderStyles,
              'active:scale-95 md:active:scale-98 active:duration-200',
              'text-[var(--border-color)]',
              wrongSelectedAnswers.includes(word) &&
                'hover:bg-[var(--card-color)]',
              !wrongSelectedAnswers.includes(word) &&
                'hover:scale-110 text-[var(--main-color)] hover:text-[var(--secondary-color)]'
            )}
            onClick={() => handleOptionClick(word)}
          >
            <span lang="ja">{word}</span>
            <span
              className={clsx(
                'hidden lg:inline text-xs rounded-full bg-[var(--border-color)] px-1',
                'text-[var(--secondary-color)]'
              )}
            >
              {i + 1 === 1 ? '1' : i + 1 === 2 ? '2' : '3'}
            </span>
          </button>
        ))}
      </div>

      <Stars />
    </div>
  );
};

export default ReversePick;
