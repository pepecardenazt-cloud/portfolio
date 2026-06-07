import { db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  
  const loadingIndicator = document.getElementById('loading-indicator');
  const mainContent = document.getElementById('project-detail-content');
  
  if (!projectId) {
    showError('No se especificó un identificador de proyecto válido en la URL.');
    return;
  }

  let unsubscribe;

  try {
    // Escucha en tiempo real (onSnapshotDoc) para sincronización inmediata
    unsubscribe = db.onSnapshotDoc('projects', projectId, (docSnap) => {
      if (!docSnap.exists()) {
        showError(`El caso de estudio con ID "${projectId}" no existe o fue eliminado.`);
        return;
      }
      
      const project = docSnap.data();
      
      // Ocultar cargando y mostrar contenedor principal
      loadingIndicator.classList.add('hidden');
      mainContent.classList.remove('hidden');
      
      // Actualizar título de la pestaña del navegador
      document.title = `${project.title || 'Caso de Estudio'} - Pepe Cárdenas`;
      
      // 1. ÁREA DE HÉROE (Incluye el Resumen Estratégico)
      renderHeroSection(project);
      
      // 3. CONTENIDO DINÁMICO (Bloques)
      renderContentSection(project);
      
      // 4. CONCLUSIONES
      renderConclusionsSection(project);
    });
  } catch (error) {
    console.error('Error al cargar el detalle del proyecto:', error);
    showError('Ocurrió un error inesperado al conectar con el servidor de base de datos.');
  }

  // Limpiar listener al salir de la página
  window.addEventListener('beforeunload', () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  });
});

// ==========================================
// RENDERIZADORES DE SECCIONES
// ==========================================

function renderHeroSection(project) {
  const section = document.getElementById('detail-hero-section');
  const title = document.getElementById('detail-title');
  const subtitle = document.getElementById('detail-subtitle');
  
  const imageContainer = document.getElementById('detail-image-container');
  const imageEl = document.getElementById('detail-image');
  
  const isVisible = project.sectionsVisibility?.hero !== false && project.hero;
  
  if (isVisible) {
    section.classList.remove('hidden');
    title.textContent = project.hero.title || project.title || '';
    subtitle.textContent = project.hero.subtitle || '';
    
    // Configurar Resumen Estratégico (ficha técnica)
    renderSummarySection(project);
    
    // Configurar Imagen del Mockup en el Hero (con fallback) - Se posiciona al final
    const heroImgUrl = (project.hero && project.hero.imageUrl) || project.thumbnailUrl || '';
    if (heroImgUrl) {
      imageEl.src = heroImgUrl;
      imageEl.alt = `Mockup de ${project.title || 'proyecto'}`;
      imageContainer.classList.remove('hidden');
    } else {
      imageContainer.classList.add('hidden');
    }
  } else {
    section.classList.add('hidden');
  }
}

function renderSummarySection(project) {
  const card = document.getElementById('summary-card');
  if (!card) return;
  
  const summary = project.summary;
  const hasData = summary && (summary.sector || summary.client || summary.projectType || summary.tools || summary.scope || summary.metrics);
  
  if (hasData) {
    card.classList.remove('hidden');
    
    // Set labels (titles) for customizable fields
    const lblType = document.getElementById('summary-label-type');
    const lblTools = document.getElementById('summary-label-tools');
    const lblScope = document.getElementById('summary-label-scope');
    const lblMetrics = document.getElementById('summary-label-metrics');
    
    if (lblType) lblType.textContent = summary.projectTypeLabel || 'Tipo de proyecto';
    if (lblTools) lblTools.textContent = summary.toolsLabel || 'Herramientas y tecnologías';
    if (lblScope) lblScope.textContent = summary.scopeLabel || 'Scope del proyecto';
    if (lblMetrics) lblMetrics.textContent = summary.metricsLabel || 'Métricas de impacto';
    
    // Set sector & client (strings - fixed labels)
    const valSector = document.getElementById('summary-val-sector');
    const valClient = document.getElementById('summary-val-client');
    if (valSector) valSector.textContent = summary.sector || '';
    if (valClient) valClient.textContent = summary.client || '';
    
    // Helper to populate a column (bullets or paragraph format)
    const populateColumn = (containerId, rawText, format) => {
      const containerEl = document.getElementById(containerId);
      if (!containerEl) return;
      containerEl.innerHTML = '';
      if (!rawText) return;
      
      const textFormat = format || 'bullets';
      
      if (textFormat === 'paragraph') {
        const p = document.createElement('p');
        p.className = 'summary-text';
        p.style.whiteSpace = 'pre-line';
        p.textContent = rawText;
        containerEl.appendChild(p);
      } else {
        const ul = document.createElement('ul');
        ul.className = 'summary-list';
        const items = rawText.split('\n').filter(item => item.trim());
        items.forEach(itemText => {
          const li = document.createElement('li');
          li.textContent = itemText.trim();
          ul.appendChild(li);
        });
        containerEl.appendChild(ul);
      }
    };
    
    // Populate columns
    populateColumn('summary-type-container', summary.projectType, summary.projectTypeFormat || 'paragraph');
    populateColumn('summary-tools-container', summary.tools, summary.toolsFormat || 'bullets');
    populateColumn('summary-scope-container', summary.scope, summary.scopeFormat || 'bullets');
    populateColumn('summary-metrics-container', summary.metrics, summary.metricsFormat || 'bullets');
  } else {
    card.classList.add('hidden');
  }
}

function renderContentSection(project) {
  const section = document.getElementById('detail-content-area');
  const isVisible = project.sectionsVisibility?.content !== false && project.content;
  
  if (isVisible) {
    section.classList.remove('hidden');
    section.innerHTML = ''; // Limpiar bloques viejos
    
    project.content.forEach((block, index) => {
      const blockDiv = document.createElement('div');
      blockDiv.className = `detail-block detail-block-${block.type}`;
      
      if (block.type === 'text') {
        // Bloque de texto
        let textElement;
        
        if (block.textType === 'paragraph') {
          textElement = document.createElement('p');
          textElement.className = 'text-p';
          textElement.textContent = block.content || '';
        } else {
          // Listas (bullet o numeric)
          textElement = document.createElement(block.textType === 'bullet-list' ? 'ul' : 'ol');
          const items = Array.isArray(block.content) ? block.content : [block.content];
          
          items.forEach(itemText => {
            const li = document.createElement('li');
            li.textContent = itemText;
            textElement.appendChild(li);
          });
        }
        
        // Aplicar estilos tipográficos personalizados si vienen de CMS
        if (block.typography) {
          applyCustomTypography(textElement, block.typography);
        }
        
        blockDiv.appendChild(textElement);
        
      } else if (block.type === 'multimedia') {
        // Bloque multimedia (Imagen / GIF)
        blockDiv.classList.add(`width-${block.layoutWidth || 'contained'}`);
        
        const img = document.createElement('img');
        img.src = block.url;
        img.alt = block.caption || 'Imagen del caso de estudio';
        img.loading = 'lazy';
        
        blockDiv.appendChild(img);
        
        if (block.caption) {
          const caption = document.createElement('span');
          caption.className = 'caption';
          caption.textContent = block.caption;
          blockDiv.appendChild(caption);
        }
      }
      
      section.appendChild(blockDiv);
    });
  } else {
    section.classList.add('hidden');
  }
}

function applyCustomTypography(element, typo) {
  if (typo.fontFamily) {
    // Si la fuente no es Geist, cargamos Google Fonts dinámicamente si no está en el documento
    if (typo.fontFamily !== 'Geist' && typo.fontFamily !== 'system-ui') {
      ensureGoogleFontLoaded(typo.fontFamily);
    }
    element.style.fontFamily = `'${typo.fontFamily}', sans-serif`;
  }
  if (typo.fontSize) {
    element.style.fontSize = typo.fontSize;
  }
  if (typo.fontWeight) {
    element.style.fontWeight = typo.fontWeight;
  }
  if (typo.fontStyle) {
    element.style.fontStyle = typo.fontStyle;
  }
}

// Cargar fuente de Google Fonts si es personalizada
const loadedFonts = new Set();
function ensureGoogleFontLoaded(fontName) {
  if (loadedFonts.has(fontName)) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(fontName);
}

function renderConclusionsSection(project) {
  const section = document.getElementById('conclusions-section');
  const resultsCol = document.getElementById('conclusion-results-col');
  const nextStepsCol = document.getElementById('conclusion-nextsteps-col');
  const resultsText = document.getElementById('conclusion-results-text');
  const nextStepsText = document.getElementById('conclusion-nextsteps-text');
  
  const isVisible = project.sectionsVisibility?.conclusions !== false && project.conclusions;
  
  if (isVisible) {
    const conclusions = project.conclusions;
    let anyVisible = false;
    
    if (conclusions.results) {
      resultsCol.classList.remove('hidden');
      resultsText.textContent = conclusions.results;
      anyVisible = true;
    } else {
      resultsCol.classList.add('hidden');
    }
    
    if (conclusions.nextSteps) {
      nextStepsCol.classList.remove('hidden');
      nextStepsText.textContent = conclusions.nextSteps;
      anyVisible = true;
    } else {
      nextStepsCol.classList.add('hidden');
    }
    
    if (anyVisible) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  } else {
    section.classList.add('hidden');
  }
}

// Mostrar mensaje de error si ocurre un problema
function showError(message) {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 24px; border: 1px solid var(--color-grey-3); border-radius: var(--size-16); background-color: var(--color-grey-4);">
        <h2 class="text-h3" style="color: var(--color-primary); margin-top: 0;">Error de Carga</h2>
        <p class="text-p">${message}</p>
        <a href="index.html" class="btn-primary" style="margin-top: 16px; display: inline-flex;">Volver al Inicio</a>
      </div>
    `;
  }
}
