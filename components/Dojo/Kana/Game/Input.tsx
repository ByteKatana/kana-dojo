'use client';
import { useState, useEffect, useRef } from 'react';
import { kana } from '@/static/kana';
import useKanaKanjiStore from '@/store/useKanaKanjiStore';
import { CircleCheck, CircleX, CircleArrowRight } from 'lucide-react';
import { Random } from 'random-js';
import clsx from 'clsx';
import { useClick, useCorrect, useError } from '@/lib/hooks/useAudio';
import GameIntel from '@/components/reusable/Game/GameIntel';
import { buttonBorderStyles } from '@/static/styles';
import { useStopwatch } from 'react-timer-hook';
import useStats from '@/lib/hooks/useStats';
import useStatsStore from '@/store/useStatsStore';
import Stars from '@/components/reusable/Game/Stars';

const random = new Random();

const Input = ({ isHidden }: { isHidden: boolean }) => {
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

  const { playClick } = useClick();
  const { playCorrect } = useCorrect();
  const { playErrorTwice } = useError();

  const inputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState('');

  const kanaGroupIndices = useKanaKanjiStore(state => state.kanaGroupIndices);

  const selectedKana = kanaGroupIndices.map(i => kana[i].kana).flat();
  const selectedRomaji = kanaGroupIndices.map(i => kana[i].romanji).flat();

  const selectedPairs = Object.fromEntries(
    selectedKana.map((key, i) => [key, selectedRomaji[i]])
  );

  const [correctKanaChar, setCorrectKanaChar] = useState(
    selectedKana[random.integer(0, selectedKana.length - 1)]
  );

  const correctRomajiChar = selectedPairs[correctKanaChar];

  const [feedback, setFeedback] = useState(<>{'feeback ~'}</>);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus(); // Automatically focuses on the input
    }
  }, []);

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/') {
        buttonRef.current?.click();
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

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (inputValue.trim().toLowerCase() === correctRomajiChar) {
        speedStopwatch.pause();
        addCorrectAnswerTime(speedStopwatch.totalMilliseconds / 1000);
        speedStopwatch.reset();
        playCorrect();
        addCharacterToHistory(correctKanaChar);
        incrementCharacterScore(correctKanaChar, 'correct');
        incrementCorrectAnswers();
        setScore(score + 1);

        setInputValue('');
        let newRandomKana =
          selectedKana[random.integer(0, selectedKana.length - 1)];
        while (newRandomKana === correctKanaChar) {
          newRandomKana =
            selectedKana[random.integer(0, selectedKana.length - 1)];
        }
        setCorrectKanaChar(newRandomKana);
        setFeedback(
          <>
            <span>{`${correctKanaChar} = ${correctRomajiChar} `}</span>
            <CircleCheck className="inline text-[var(--main-color)]" />
          </>
        );
      } else {
        setInputValue('');
        setFeedback(
          <>
            <span>{`${correctKanaChar} ≠ ${inputValue} `}</span>
            <CircleX className="inline text-[var(--main-color)]" />
          </>
        );
        playErrorTwice();

        incrementCharacterScore(correctKanaChar, 'wrong');
        incrementWrongAnswers();
        if (score - 1 < 0) {
          setScore(0);
        } else {
          setScore(score - 1);
        }
      }
    }
  };

  const handleSkip = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
    e.currentTarget.blur();
    setInputValue('');
    let newRandomKana =
      selectedKana[random.integer(0, selectedKana.length - 1)];
    while (newRandomKana === correctKanaChar) {
      newRandomKana = selectedKana[random.integer(0, selectedKana.length - 1)];
    }
    setCorrectKanaChar(newRandomKana);
    setFeedback(<>{`skipped ~ ${correctKanaChar} = ${correctRomajiChar}`}</>);
  };

  return (
    <div
      className={clsx(
        'flex flex-col gap-4 sm:gap-10 items-center w-full sm:w-4/5',
        isHidden ? 'hidden' : ''
      )}
    >
      <GameIntel
        feedback={feedback}
        gameMode="input"
      />
      <p className="text-8xl sm:text-9xl font-medium">{correctKanaChar}</p>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        className={clsx(
          'border-b-2 pb-1 text-center  focus:outline-none  text-2xl lg:text-5xl',
          'border-[var(--card-color)] focus:border-[var(--border-color)]'
        )}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleEnter}
      />
      <button
        ref={buttonRef}
        className={clsx(
          'text-xl font-medium  py-4 px-16 ',
          'flex flex-row items-end gap-2',
          buttonBorderStyles,
          'active:scale-95 md:active:scale-98 active:duration-200',
          'text-[var(--secondary-color)]'
        )}
        onClick={handleSkip}
      >
        <span>skip</span>
        <CircleArrowRight />
      </button>
      <Stars />
    </div>
  );
};

export default Input;
