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
});
