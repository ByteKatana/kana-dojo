import fonts from '@/static/fonts';
import clsx from 'clsx';

const fontClassName = fonts[2].font.className;

const Sandbox = () => {
  return (
    <div className='relative h-96 w-full'>
      <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  p-8'>
        <p className={clsx(fontClassName, 'text-9xl text-pink-600')}>出</p>
      </div>
    </div>
  );
};

export default Sandbox;
