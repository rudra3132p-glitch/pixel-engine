/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Tutorial Overlay
   A step-by-step interactive onboarding guide for first-time users.
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect } from 'react';

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
  highlight?: string; // CSS selector to highlight
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Pixel Engine! 🎮',
    description:
      'This is a lightweight 2D game engine with a built-in level editor. ' +
      'The demo scene already has some objects set up — boxes, walls, a floor, and a platform. ' +
      'Let\'s walk through how everything works!',
    icon: '🚀',
  },
  {
    title: 'Hit Play to Start the Simulation',
    description:
      'Click the green ▶ Play button in the top header (or press Spacebar). ' +
      'The boxes will fall under gravity, bounce off the floor and platform, and collide with walls. ' +
      'Click ■ Stop (or Spacebar again) to reset everything back to its original position.',
    icon: '▶️',
    highlight: '.pe-btn--play',
  },
  {
    title: 'Navigate the Viewport',
    description:
      '• Scroll the mouse wheel to zoom in and out.\n' +
      '• Hold Alt + Left Click and drag to pan the camera.\n' +
      '• On mobile/tablet, use pinch-to-zoom and two-finger drag.',
    icon: '🔍',
  },
  {
    title: 'Select & Inspect Objects',
    description:
      'In the Scene panel on the right, click on any entity (like "Cyan Box" or "Pink Box"). ' +
      'The Inspector will appear below showing all its components — Transform (position, scale), ' +
      'Sprite (size, color), and RigidBody (mass, gravity, bounce). Edit any value to see changes instantly!',
    icon: '🔧',
    highlight: '.pe-panel',
  },
  {
    title: 'Add New Objects',
    description:
      'Click the "+ Add Entity" button in the Scene panel to create a new object. ' +
      'It starts with a Transform and a cyan Sprite. Select it, then click "Add Physics" in the Inspector ' +
      'to give it a RigidBody and Collider so it interacts with the world when you hit Play!',
    icon: '➕',
  },
  {
    title: 'Tweak Physics Properties',
    description:
      'Select any entity with physics and try changing these values in the Inspector:\n' +
      '• Bounce (Restitution): Set to 1.0 for a super bouncy ball!\n' +
      '• Gravity Scale: Set to 0 for a floating object.\n' +
      '• Mass: Heavier objects push lighter ones.\n' +
      '• Type: Change to "static" for immovable platforms.',
    icon: '⚡',
  },
  {
    title: 'Save & Load Levels',
    description:
      'Click Save in the top-right to download your level as a JSON file. ' +
      'Click Load to import a previously saved level. Your entire scene — every entity, ' +
      'its position, physics settings, and more — is preserved!',
    icon: '💾',
    highlight: '.pe-header__right',
  },
  {
    title: 'Debug Colliders',
    description:
      'Click the dashed-square "Debug" button on the left toolbar to toggle collider visualization. ' +
      'This shows the AABB hitboxes around each entity, which is helpful for understanding ' +
      'why objects collide the way they do.',
    icon: '🐛',
    highlight: '.pe-toolbar',
  },
  {
    title: 'You\'re Ready! 🎉',
    description:
      'That\'s everything you need to know! Go ahead and experiment — add objects, change physics, ' +
      'hit Play, and watch your creations come to life. Have fun building!',
    icon: '🏁',
  },
];

interface TutorialOverlayProps {
  onClose: () => void;
}

export function TutorialOverlay({ onClose }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const next = useCallback(() => {
    if (isLast) {
      handleClose();
    } else {
      setCurrentStep(s => s + 1);
    }
  }, [isLast]);

  const prev = useCallback(() => {
    setCurrentStep(s => Math.max(0, s - 1));
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, handleClose]);

  // Highlight target element
  useEffect(() => {
    if (!step.highlight) return;
    const el = document.querySelector(step.highlight) as HTMLElement | null;
    if (el) {
      el.style.position = 'relative';
      el.style.zIndex = '1001';
      el.style.boxShadow = '0 0 0 4px rgba(0, 229, 255, 0.4), 0 0 30px rgba(0, 229, 255, 0.15)';
      el.style.transition = 'box-shadow 0.3s ease';
    }
    return () => {
      if (el) {
        el.style.zIndex = '';
        el.style.boxShadow = '';
      }
    };
  }, [step.highlight]);

  return (
    <div
      className={`tutorial-overlay ${isExiting ? 'tutorial-overlay--exit' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`tutorial-card ${isExiting ? 'tutorial-card--exit' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Step indicator dots */}
        <div className="tutorial-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`tutorial-dot ${i === currentStep ? 'tutorial-dot--active' : ''} ${i < currentStep ? 'tutorial-dot--done' : ''}`}
              onClick={() => setCurrentStep(i)}
              title={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="tutorial-icon">{step.icon}</div>

        {/* Content */}
        <h2 className="tutorial-title">{step.title}</h2>
        <div className="tutorial-description">
          {step.description.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        {/* Step counter */}
        <div className="tutorial-counter">
          {currentStep + 1} / {STEPS.length}
        </div>

        {/* Navigation buttons */}
        <div className="tutorial-nav">
          <button
            className="tutorial-btn tutorial-btn--skip"
            onClick={handleClose}
          >
            Skip Tutorial
          </button>
          <div className="tutorial-nav__right">
            {!isFirst && (
              <button className="tutorial-btn tutorial-btn--back" onClick={prev}>
                ← Back
              </button>
            )}
            <button className="tutorial-btn tutorial-btn--next" onClick={next}>
              {isLast ? 'Get Started! 🎮' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
