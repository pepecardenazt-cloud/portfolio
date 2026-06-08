document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.querySelector('.theme-toggle');
  
  if (themeToggleBtn) {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.body.classList.add('dark-mode');
    }
    
    // Toggle theme on button click
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      
      if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
      }
    });
  }



  // Scroll detection for sticky header shadow
  const headerWrapper = document.querySelector('.header-wrapper');
  if (headerWrapper) {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        headerWrapper.classList.add('scrolled');
      } else {
        headerWrapper.classList.remove('scrolled');
      }
    };
    
    // Check scroll state initially
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // Mobile tech-tags infinite slider with pause-on-tap and drag-to-scroll
  const tagsContainer = document.querySelector('.tech-tags-container');
  const tagsTrack = document.querySelector('.tech-tags-track');
  
  if (tagsContainer && tagsTrack) {
    let trackWidth = tagsTrack.offsetWidth;
    let isPaused = false;
    let isDragging = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    // Sub-pixel scroll accumulator to ensure smooth movement on all viewports
    let currentScroll = tagsContainer.scrollLeft;
    let lastTime = 0;

    // Update track width on resize or orientation change
    const updateTrackWidth = () => {
      trackWidth = tagsTrack.offsetWidth;
    };
    window.addEventListener('resize', updateTrackWidth);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateTrackWidth, 200);
    });

    // Auto-scroll loop using requestAnimationFrame and high-precision deltaTime
    const autoScroll = (timestamp) => {
      if (!lastTime) {
        lastTime = timestamp;
        requestAnimationFrame(autoScroll);
        return;
      }
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // Avoid huge jumps if the user switches tabs or pauses for a long time
      const delta = Math.min(deltaTime, 100);

      if (window.innerWidth <= 768 && !isPaused && !isDragging) {
        if (trackWidth === 0) {
          trackWidth = tagsTrack.offsetWidth;
        }
        if (trackWidth > 0) {
          // Math to match desktop speed: completes 1 full loop (trackWidth px) in exactly 65 seconds
          const speed = trackWidth / 65000;
          currentScroll += speed * delta;
          tagsContainer.scrollLeft = currentScroll;
        }
      }
      requestAnimationFrame(autoScroll);
    };
    requestAnimationFrame(autoScroll);

    // Track scroll events to loop infinitely in both directions
    tagsContainer.addEventListener('scroll', () => {
      if (window.innerWidth <= 768) {
        if (trackWidth === 0) {
          trackWidth = tagsTrack.offsetWidth;
        }
        if (trackWidth > 0) {
          if (tagsContainer.scrollLeft >= trackWidth) {
            tagsContainer.scrollLeft -= trackWidth;
          } else if (tagsContainer.scrollLeft <= 0) {
            tagsContainer.scrollLeft += trackWidth;
          }
        }
      }
      // Always sync the accumulator with the actual scrollLeft during manual swipe or loop reset
      currentScroll = tagsContainer.scrollLeft;
    });

    // Handle touch interactions
    tagsContainer.addEventListener('touchstart', (e) => {
      if (window.innerWidth <= 768) {
        isDragging = true;
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    tagsContainer.addEventListener('touchend', (e) => {
      if (window.innerWidth <= 768) {
        isDragging = false;
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        const timeElapsed = Date.now() - touchStartTime;

        // If it was a quick touch with almost no movement, toggle pause/play
        if (deltaX < 10 && deltaY < 10 && timeElapsed < 300) {
          isPaused = !isPaused;
        }
      }
    }, { passive: true });
  }
});
