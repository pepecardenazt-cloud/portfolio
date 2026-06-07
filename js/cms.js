import { db, storage } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elementos de la interfaz
  const projectsList = document.getElementById('sidebar-projects-list');
  const btnCreateProject = document.getElementById('btn-create-project');
  const btnDeleteProject = document.getElementById('btn-delete-project');
  const btnSaveProject = document.getElementById('btn-save-project');
  const actionTitle = document.getElementById('editor-action-title');
  const form = document.getElementById('project-editor-form');
  const toast = document.getElementById('toast-message');
  
  // Toggles de Visibilidad
  const toggleHero = document.getElementById('toggle-hero');
  const toggleContent = document.getElementById('toggle-content');
  const toggleConclusions = document.getElementById('toggle-conclusions');
  
  // Contenedores de Campos
  const heroFields = document.getElementById('hero-fields-container');
  const contentFields = document.getElementById('content-fields-container');
  const conclusionsFields = document.getElementById('conclusions-fields-container');
  
  // Campos del Formulario
  const projTitle = document.getElementById('proj-title');
  const projCompany = document.getElementById('proj-company');
  const projSlug = document.getElementById('proj-slug');
  const projOrder = document.getElementById('proj-order');
  const projThumbUrl = document.getElementById('proj-thumbnail-url');
  
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroFileImage = document.getElementById('hero-file-image');
  const heroImageFilename = document.getElementById('hero-image-filename');
  const heroImageUrl = document.getElementById('hero-image-url');
  const heroImagePreviewContainer = document.getElementById('hero-image-preview-container');
  const heroImagePreview = document.getElementById('hero-image-preview');
  
  const summaryClient = document.getElementById('summary-client');
  const summarySector = document.getElementById('summary-sector');
  const summaryType = document.getElementById('summary-type');
  const summaryTypeLabel = document.getElementById('summary-type-label');
  const summaryTypeFormat = document.getElementById('summary-type-format');
  const summaryTools = document.getElementById('summary-tools');
  const summaryToolsLabel = document.getElementById('summary-tools-label');
  const summaryToolsFormat = document.getElementById('summary-tools-format');
  const summaryScope = document.getElementById('summary-scope');
  const summaryScopeLabel = document.getElementById('summary-scope-label');
  const summaryScopeFormat = document.getElementById('summary-scope-format');
  const summaryMetrics = document.getElementById('summary-metrics');
  const summaryMetricsLabel = document.getElementById('summary-metrics-label');
  const summaryMetricsFormat = document.getElementById('summary-metrics-format');
  
  const conclusionResults = document.getElementById('conclusion-results');
  const conclusionNextSteps = document.getElementById('conclusion-nextsteps');
  
  // Botones de Constructores
  const btnAddTextBlock = document.getElementById('btn-add-text-block');
  const btnAddMediaBlock = document.getElementById('btn-add-media-block');
  
  // Contenedores Dinámicos
  const blocksContainer = document.getElementById('builder-blocks-container');
  
  // Thumb File Input
  const fileInputThumb = document.getElementById('proj-file-thumb');
  const thumbFilename = document.getElementById('thumb-filename');
  const thumbPreviewContainer = document.getElementById('thumb-preview-container');
  const thumbPreview = document.getElementById('thumb-preview');
  
  // Elementos de Cropper
  const cropperModal = document.getElementById('cropper-modal');
  const cropperImageSrc = document.getElementById('cropper-image-src');
  const btnCloseCropper = document.getElementById('btn-close-cropper');
  const btnCancelCrop = document.getElementById('btn-cancel-crop');
  const btnApplyCrop = document.getElementById('btn-apply-crop');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  let cropperInstance = null;
  let croppingTarget = 'thumb'; // 'thumb' o 'hero'
  
  // Estado de la aplicación
  let activeProjectId = null; // null significa "Creando Proyecto"
  let loadedProjects = [];
  let blockList = []; // Lista local de bloques de contenido

  // ==========================================
  // CONFIGURACIÓN DE TOGGLES
  // ==========================================
  const setupToggle = (toggleEl, containerEl) => {
    toggleEl.addEventListener('change', () => {
      if (toggleEl.checked) {
        containerEl.style.opacity = '1';
        containerEl.style.pointerEvents = 'all';
      } else {
        containerEl.style.opacity = '0.4';
        containerEl.style.pointerEvents = 'none';
      }
    });
  };

  setupToggle(toggleHero, heroFields);
  setupToggle(toggleContent, contentFields);
  setupToggle(toggleConclusions, conclusionsFields);

  // Auto-completado de slug a partir del título
  projTitle.addEventListener('input', () => {
    if (activeProjectId === null) { // Solo autogenerar si estamos creando
      projSlug.value = projTitle.value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remover acentos
        .replace(/[^a-z0-9\s-]/g, "")    // Remover caracteres especiales
        .trim()
        .replace(/\s+/g, "-");           // Reemplazar espacios por guiones
    }
  });

  // ==========================================
  // ESCUCHA DE PROYECTOS (SIDEBAR)
  // ==========================================
  db.onSnapshotCollection('projects', (snapshot) => {
    projectsList.innerHTML = '';
    loadedProjects = [];
    
    const docs = snapshot.docs || [];
    
    if (docs.length === 0) {
      projectsList.innerHTML = '<p class="text-p2" style="text-align: center; color: var(--color-grey); padding: 16px;">No hay proyectos. ¡Crea uno nuevo!</p>';
      return;
    }
    
    docs.forEach(doc => {
      const p = doc.data();
      const id = doc.id;
      loadedProjects.push({ id, ...p });
      
      const item = document.createElement('div');
      item.className = 'project-list-item';
      if (activeProjectId === id) item.classList.add('active');
      
      item.innerHTML = `
        <div style="display: flex; flex-direction: column;">
          <span class="project-item-name">${p.title || 'Sin Título'}</span>
          <span class="project-item-company">${p.company || 'Sin Compañía'}</span>
        </div>
        <span style="font-size: 11px; font-weight: bold; background: var(--color-grey-3); padding: 2px 6px; border-radius: 4px; color: var(--color-grey);">
          #${p.order || 0}
        </span>
      `;
      
      item.addEventListener('click', () => selectProject(id));
      projectsList.appendChild(item);
    });
  });

  // ==========================================
  // SELECCIONAR PROYECTO
  // ==========================================
  function selectProject(id) {
    activeProjectId = id;
    const project = loadedProjects.find(p => p.id === id);
    
    if (!project) return;
    
    // Resaltar en sidebar
    document.querySelectorAll('.project-list-item').forEach((item, idx) => {
      if (loadedProjects[idx].id === id) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    actionTitle.textContent = "Editar Proyecto";
    btnDeleteProject.classList.remove('hidden');
    
    // Llenar campos básicos
    projTitle.value = project.title || '';
    projCompany.value = project.company || '';
    projSlug.value = project.slug || '';
    projOrder.value = project.order || '';
    projThumbUrl.value = project.thumbnailUrl || '';
    
    // Thumbnail Preview
    if (project.thumbnailUrl) {
      thumbFilename.textContent = "Archivo en el servidor";
      thumbPreview.src = project.thumbnailUrl;
      thumbPreviewContainer.classList.remove('hidden');
    } else {
      thumbFilename.textContent = "Ningún archivo seleccionado";
      thumbPreviewContainer.classList.add('hidden');
    }

    // Configurar Toggles
    const vis = project.sectionsVisibility || { hero: true, content: true, conclusions: true };
    toggleHero.checked = vis.hero !== false;
    toggleContent.checked = vis.content !== false;
    toggleConclusions.checked = vis.conclusions !== false;
    
    // Disparar eventos change para actualizar opacidad visual
    toggleHero.dispatchEvent(new Event('change'));
    toggleContent.dispatchEvent(new Event('change'));
    toggleConclusions.dispatchEvent(new Event('change'));

    // Hero Area
    const hero = project.hero || {};
    heroTitle.value = hero.title || '';
    heroSubtitle.value = hero.subtitle || '';
    heroImageUrl.value = hero.imageUrl || '';
    
    if (hero.imageUrl) {
      heroImageFilename.textContent = "Archivo en el servidor";
      heroImagePreview.src = hero.imageUrl;
      heroImagePreviewContainer.classList.remove('hidden');
    } else {
      heroImageFilename.textContent = "Ningún archivo seleccionado";
      heroImagePreviewContainer.classList.add('hidden');
    }

    // Resumen Estratégico
    const summary = project.summary || {};
    summaryClient.value = summary.client || '';
    summarySector.value = summary.sector || '';
    summaryType.value = summary.projectType || '';
    if (summaryTypeLabel) summaryTypeLabel.value = summary.projectTypeLabel || 'Tipo de proyecto';
    if (summaryTypeFormat) summaryTypeFormat.value = summary.projectTypeFormat || 'paragraph';
    summaryTools.value = summary.tools || '';
    if (summaryToolsLabel) summaryToolsLabel.value = summary.toolsLabel || 'Herramientas y tecnologías';
    if (summaryToolsFormat) summaryToolsFormat.value = summary.toolsFormat || 'bullets';
    summaryScope.value = summary.scope || '';
    if (summaryScopeLabel) summaryScopeLabel.value = summary.scopeLabel || 'Scope del proyecto';
    if (summaryScopeFormat) summaryScopeFormat.value = summary.scopeFormat || 'bullets';
    summaryMetrics.value = summary.metrics || '';
    if (summaryMetricsLabel) summaryMetricsLabel.value = summary.metricsLabel || 'Métricas de impacto';
    if (summaryMetricsFormat) summaryMetricsFormat.value = summary.metricsFormat || 'bullets';

    // Conclusiones
    const conc = project.conclusions || {};
    conclusionResults.value = conc.results || '';
    conclusionNextSteps.value = conc.nextSteps || '';

    // Limpiar y renderizar constructor de bloques
    blockList = project.content ? JSON.parse(JSON.stringify(project.content)) : [];
    renderBlocksList();
  }

  // ==========================================
  // BOTÓN CREAR PROYECTO (RESET)
  // ==========================================
  btnCreateProject.addEventListener('click', () => {
    activeProjectId = null;
    form.reset();
    // (Resets de variables eliminadas)
    if (heroImageUrl) heroImageUrl.value = '';
    if (heroImageFilename) heroImageFilename.textContent = "Ningún archivo seleccionado";
    if (heroImagePreviewContainer) heroImagePreviewContainer.classList.add('hidden');
    actionTitle.textContent = "Crear Nuevo Proyecto";
    btnDeleteProject.classList.add('hidden');
    
    // Quitar active del sidebar
    document.querySelectorAll('.project-list-item').forEach(item => item.classList.remove('active'));
    
    // Resetear vistas previas
    thumbFilename.textContent = "Ningún archivo seleccionado";
    thumbPreviewContainer.classList.add('hidden');
    projThumbUrl.value = '';
    
    // Toggles por defecto habilitados
    toggleHero.checked = true;
    toggleContent.checked = true;
    toggleConclusions.checked = true;
    
    // Disparar eventos change para actualizar opacidad visual
    toggleHero.dispatchEvent(new Event('change'));
    toggleContent.dispatchEvent(new Event('change'));
    toggleConclusions.dispatchEvent(new Event('change'));
    if (summaryTypeLabel) summaryTypeLabel.value = 'Tipo de proyecto';
    if (summaryTypeFormat) summaryTypeFormat.value = 'paragraph';
    if (summaryToolsLabel) summaryToolsLabel.value = 'Herramientas y tecnologías';
    if (summaryToolsFormat) summaryToolsFormat.value = 'bullets';
    if (summaryScopeLabel) summaryScopeLabel.value = 'Scope del proyecto';
    if (summaryScopeFormat) summaryScopeFormat.value = 'bullets';
    if (summaryMetricsLabel) summaryMetricsLabel.value = 'Métricas de impacto';
    if (summaryMetricsFormat) summaryMetricsFormat.value = 'bullets';
    blockList = [];
    renderBlocksList();
  });

  // ==========================================
  // CARGA DE IMÁGENES Y RECORTES (Cropper.js)
  // ==========================================
  let currentFile = null;

  // Carga de Imagen de Héroe
  if (heroFileImage) {
    heroFileImage.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      croppingTarget = 'hero';
      currentFile = file;
      heroImageFilename.textContent = file.name;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        cropperImageSrc.src = event.target.result;
        
        // Mostrar modal
        cropperModal.classList.add('active');
        
        if (cropperInstance) {
          cropperInstance.destroy();
        }
        
        setTimeout(() => {
          cropperInstance = new Cropper(cropperImageSrc, {
            aspectRatio: 16 / 9, // Relación de aspecto de imagen del héroe (16:9)
            viewMode: 1, // Limita el movimiento dentro de la imagen
            dragMode: 'move', // Por defecto permite arrastrar y mover
            autoCropArea: 1,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
          });
        }, 50);
      };
      reader.readAsDataURL(file);
    });
  }

  // Carga de Thumbnail Portada
  fileInputThumb.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    croppingTarget = 'thumb';
    currentFile = file;
    thumbFilename.textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      cropperImageSrc.src = event.target.result;
      
      // Mostrar modal
      cropperModal.classList.add('active');
      
      if (cropperInstance) {
        cropperInstance.destroy();
      }
      
      setTimeout(() => {
        cropperInstance = new Cropper(cropperImageSrc, {
          aspectRatio: 512 / 320, // Relación de aspecto de tarjeta a sangre completa (512x320)
          viewMode: 1, // Limita el movimiento dentro de la imagen
          dragMode: 'move', // Por defecto permite arrastrar y mover
          autoCropArea: 1,
          restore: false,
          guides: true,
          center: true,
          highlight: false,
          cropBoxMovable: true,
          cropBoxResizable: true,
          toggleDragModeOnDblclick: false
        });
      }, 50);
    };
    reader.readAsDataURL(file);
  });

  // Zoom del Cropper
  btnZoomIn.addEventListener('click', () => {
    if (cropperInstance) cropperInstance.zoom(0.1);
  });

  btnZoomOut.addEventListener('click', () => {
    if (cropperInstance) cropperInstance.zoom(-0.1);
  });

  // Cerrar / Cancelar
  const closeCropperModal = () => {
    cropperModal.classList.remove('active');
    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }
    fileInputThumb.value = '';
    if (heroFileImage) heroFileImage.value = '';
  };

  btnCancelCrop.addEventListener('click', closeCropperModal);
  btnCloseCropper.addEventListener('click', closeCropperModal);

  // Aplicar Recorte y Guardar
  btnApplyCrop.addEventListener('click', () => {
    if (!cropperInstance) return;
    
    // Configurar dimensiones y mensajes según el objetivo de recorte
    const width = croppingTarget === 'thumb' ? 800 : 960;
    const height = croppingTarget === 'thumb' ? 500 : 540;
    const folder = croppingTarget === 'thumb' ? 'thumbnails' : 'hero_images';
    const message = croppingTarget === 'thumb' ? "Ajustando portada..." : "Ajustando imagen de héroe...";
    const saveMessage = croppingTarget === 'thumb' ? "Guardando portada..." : "Guardando imagen de héroe...";
    const successMessage = croppingTarget === 'thumb' ? "Imagen de portada aplicada con éxito." : "Imagen de héroe aplicada con éxito.";
    const errorMessage = croppingTarget === 'thumb' ? "Error al guardar la portada." : "Error al guardar la imagen de héroe.";
    
    const canvas = cropperInstance.getCroppedCanvas({
      width: width,
      height: height
    });
    
    if (!canvas) {
      showToast("Error al recortar la imagen.");
      closeCropperModal();
      return;
    }
    
    showToast(message);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast("Error al comprimir la imagen.");
        closeCropperModal();
        return;
      }
      
      const croppedFile = new File([blob], currentFile.name, { type: 'image/jpeg' });
      
      try {
        showToast(saveMessage);
        const url = await storage.uploadFile(`${folder}/${Date.now()}_cropped_${currentFile.name}`, croppedFile);
        
        if (croppingTarget === 'thumb') {
          projThumbUrl.value = url;
          thumbPreview.src = url;
          thumbPreviewContainer.classList.remove('hidden');
        } else {
          heroImageUrl.value = url;
          heroImagePreview.src = url;
          heroImagePreviewContainer.classList.remove('hidden');
        }
        
        showToast(successMessage);
        closeCropperModal();
      } catch (error) {
        console.error("Error al procesar archivo recortado:", error);
        showToast(errorMessage);
        closeCropperModal();
        fetch('/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'crop_upload_error', message: error.message || String(error), stack: error.stack })
        });
      }
    }, 'image/jpeg', 0.85);
  });

  // ==========================================
  // CAMPOS DINÁMICOS DE RESUMEN (Custom Fields - Eliminado)
  // ==========================================

  // ==========================================
  // CONSTRUCTOR DINÁMICO DE BLOQUES
  // ==========================================
  
  // Agregar bloque de texto
  btnAddTextBlock.addEventListener('click', () => {
    blockList.push({
      type: 'text',
      textType: 'paragraph',
      content: '',
      typography: {
        fontFamily: 'Geist',
        fontSize: '16px',
        fontWeight: '400',
        fontStyle: 'normal'
      }
    });
    renderBlocksList();
  });

  // Agregar bloque multimedia
  btnAddMediaBlock.addEventListener('click', () => {
    blockList.push({
      type: 'multimedia',
      url: '',
      caption: '',
      layoutWidth: 'contained'
    });
    renderBlocksList();
  });

  // Renderizar la lista de bloques
  function renderBlocksList() {
    blocksContainer.innerHTML = '';
    
    if (blockList.length === 0) {
      blocksContainer.innerHTML = '<p class="text-p2" style="text-align: center; color: var(--color-grey); padding: var(--size-16);">No se han agregado bloques de contenido. Utiliza los botones de abajo para añadir secciones de texto o multimedia.</p>';
      return;
    }
    
    blockList.forEach((block, index) => {
      const blockEl = document.createElement('div');
      blockEl.className = 'builder-block';
      
      // Cabecera del bloque con controles
      const headerRow = document.createElement('div');
      headerRow.className = 'block-header-row';
      
      const badge = document.createElement('span');
      badge.className = 'block-type-badge';
      badge.textContent = `Bloque ${index + 1}: ${block.type === 'text' ? 'Texto' : 'Multimedia'}`;
      
      const controls = document.createElement('div');
      controls.className = 'block-controls';
      
      // Botón Subir
      const btnUp = document.createElement('button');
      btnUp.type = 'button';
      btnUp.className = 'btn-icon-control';
      btnUp.innerHTML = '▲';
      btnUp.disabled = index === 0;
      btnUp.addEventListener('click', () => moveBlock(index, -1));
      
      // Botón Bajar
      const btnDown = document.createElement('button');
      btnDown.type = 'button';
      btnDown.className = 'btn-icon-control';
      btnDown.innerHTML = '▼';
      btnDown.disabled = index === blockList.length - 1;
      btnDown.addEventListener('click', () => moveBlock(index, 1));
      
      // Botón Eliminar
      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'btn-icon-delete';
      btnDel.style.padding = '4px';
      btnDel.innerHTML = `
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      btnDel.addEventListener('click', () => deleteBlock(index));
      
      controls.appendChild(btnUp);
      controls.appendChild(btnDown);
      controls.appendChild(btnDel);
      
      headerRow.appendChild(badge);
      headerRow.appendChild(controls);
      blockEl.appendChild(headerRow);

      // Render de campos específicos por bloque
      if (block.type === 'text') {
        renderTextBlockFields(block, index, blockEl);
      } else {
        renderMediaBlockFields(block, index, blockEl);
      }
      
      blocksContainer.appendChild(blockEl);
    });
  }

  // Bloque TEXTO
  function renderTextBlockFields(block, index, parent) {
    const textTypeGroup = document.createElement('div');
    textTypeGroup.className = 'form-row';
    
    // Tipo de texto (Párrafo, lista)
    textTypeGroup.innerHTML = `
      <div class="form-group" style="flex: 1;">
        <label class="form-label">Tipo de Formato</label>
        <select class="form-select block-text-format-select" data-index="${index}">
          <option value="paragraph" ${block.textType === 'paragraph' ? 'selected' : ''}>Párrafo simple</option>
          <option value="bullet-list" ${block.textType === 'bullet-list' ? 'selected' : ''}>Lista con viñetas (Bullets)</option>
          <option value="numeric-list" ${block.textType === 'numeric-list' ? 'selected' : ''}>Lista numérica</option>
        </select>
      </div>
    `;
    
    // Configuración Tipográfica
    const typoDiv = document.createElement('div');
    typoDiv.className = 'block-typo-settings';
    
    const fonts = ['Geist', 'Inter', 'Outfit', 'Roboto', 'Montserrat', 'Lora', 'Playfair Display'];
    const sizes = ['14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];
    const weights = ['300', '400', '500', '600', '700'];
    const styles = ['normal', 'italic'];
    
    const typo = block.typography || { fontFamily: 'Geist', fontSize: '16px', fontWeight: '400', fontStyle: 'normal' };
    
    typoDiv.innerHTML = `
      <div class="form-group">
        <label class="form-label" style="font-size: 11px;">Fuente</label>
        <select class="form-select font-family-select" style="padding: 6px 12px; font-size: 12px;" data-index="${index}">
          ${fonts.map(f => `<option value="${f}" ${typo.fontFamily === f ? 'selected' : ''}>${f}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-size: 11px;">Tamaño</label>
        <select class="form-select font-size-select" style="padding: 6px 12px; font-size: 12px;" data-index="${index}">
          ${sizes.map(s => `<option value="${s}" ${typo.fontSize === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-size: 11px;">Peso</label>
        <select class="form-select font-weight-select" style="padding: 6px 12px; font-size: 12px;" data-index="${index}">
          ${weights.map(w => `<option value="${w}" ${typo.fontWeight === w ? 'selected' : ''}>${w}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-size: 11px;">Estilo</label>
        <select class="form-select font-style-select" style="padding: 6px 12px; font-size: 12px;" data-index="${index}">
          ${styles.map(st => `<option value="${st}" ${typo.fontStyle === st ? 'selected' : ''}>${st === 'normal' ? 'Normal' : 'Cursiva'}</option>`).join('')}
        </select>
      </div>
    `;
    
    // Contenedor de redacción
    const contentGroup = document.createElement('div');
    contentGroup.className = 'form-group';
    contentGroup.style.marginTop = '12px';
    
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Contenido del Texto';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'form-textarea block-content-textarea';
    textarea.setAttribute('data-index', index);
    
    if (block.textType === 'paragraph') {
      textarea.placeholder = "Redacta el contenido de este párrafo...";
      textarea.value = block.content || '';
    } else {
      textarea.placeholder = "Escribe cada ítem de la lista en una nueva línea (presiona Enter para agregar un nuevo ítem)...";
      textarea.value = Array.isArray(block.content) ? block.content.join('\n') : (block.content || '');
    }
    
    contentGroup.appendChild(label);
    contentGroup.appendChild(textarea);
    
    parent.appendChild(textTypeGroup);
    parent.appendChild(typoDiv);
    parent.appendChild(contentGroup);
    
    // Eventos de cambios inmediatos en el array
    textarea.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      const val = e.target.value;
      if (blockList[idx].textType === 'paragraph') {
        blockList[idx].content = val;
      } else {
        blockList[idx].content = val.split('\n').filter(line => line.trim() !== '');
      }
    });

    const formatSelect = textTypeGroup.querySelector('.block-text-format-select');
    formatSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      const oldVal = blockList[idx].textType;
      const newVal = e.target.value;
      
      blockList[idx].textType = newVal;
      
      // Adaptar el contenido de texto si cambia de párrafo a lista o viceversa
      if (oldVal === 'paragraph' && newVal !== 'paragraph') {
        blockList[idx].content = blockList[idx].content ? [blockList[idx].content] : [];
      } else if (oldVal !== 'paragraph' && newVal === 'paragraph') {
        blockList[idx].content = Array.isArray(blockList[idx].content) ? blockList[idx].content.join('\n') : '';
      }
      
      renderBlocksList();
    });

    // Eventos de tipografía
    const updateTypo = (selector, key) => {
      typoDiv.querySelector(selector).addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        blockList[idx].typography[key] = e.target.value;
      });
    };
    
    updateTypo('.font-family-select', 'fontFamily');
    updateTypo('.font-size-select', 'fontSize');
    updateTypo('.font-weight-select', 'fontWeight');
    updateTypo('.font-style-select', 'fontStyle');
  }

  // Bloque MULTIMEDIA (Subida de Imagen)
  function renderMediaBlockFields(block, index, parent) {
    const row = document.createElement('div');
    row.className = 'form-row';
    
    // Botón de subir archivo y vista previa
    const uploadGroup = document.createElement('div');
    uploadGroup.className = 'form-group';
    uploadGroup.innerHTML = `
      <label class="form-label">Subir Archivo (Imagen o GIF)</label>
      <div style="display: flex; gap: 12px; align-items: center;">
        <input type="file" class="block-file-input" style="display: none;" id="block-file-${index}" data-index="${index}" accept="image/png, image/jpeg, image/gif">
        <button type="button" class="btn-secondary" onclick="document.getElementById('block-file-${index}').click()">
          Subir Archivo
        </button>
        <span class="text-p2 block-filename" id="block-filename-${index}" style="color: var(--color-grey); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${block.url ? 'Imagen subida' : 'Ningún archivo'}
        </span>
      </div>
      <input type="hidden" class="block-image-url-hidden" id="block-url-hidden-${index}" value="${block.url || ''}">
    `;
    
    // Vista previa imagen
    const previewDiv = document.createElement('div');
    previewDiv.style.marginTop = '8px';
    previewDiv.className = block.url ? '' : 'hidden';
    previewDiv.id = `block-preview-container-${index}`;
    previewDiv.innerHTML = `
      <img id="block-preview-img-${index}" src="${block.url || ''}" alt="Preview" style="max-height: 80px; border-radius: var(--radius-sm); border: 1px solid var(--color-grey-3);">
    `;
    uploadGroup.appendChild(previewDiv);
    
    // Ancho del diseño (contained, half, full)
    const layoutGroup = document.createElement('div');
    layoutGroup.className = 'form-group';
    layoutGroup.innerHTML = `
      <label class="form-label">Ancho de Visualización</label>
      <select class="form-select block-layout-select" data-index="${index}">
        <option value="contained" ${block.layoutWidth === 'contained' ? 'selected' : ''}>Centrado en Retícula (100% Contenedor)</option>
        <option value="half" ${block.layoutWidth === 'half' ? 'selected' : ''}>Ancho Reducido (60%)</option>
        <option value="full" ${block.layoutWidth === 'full' ? 'selected' : ''}>Pantalla Completa (100% Ancho Ventana)</option>
      </select>
    `;
    
    row.appendChild(uploadGroup);
    row.appendChild(layoutGroup);
    
    // Leyenda de la foto (Caption)
    const captionGroup = document.createElement('div');
    captionGroup.className = 'form-group';
    captionGroup.style.marginTop = '12px';
    captionGroup.innerHTML = `
      <label class="form-label" for="block-caption-${index}">Leyenda descriptiva (Caption)</label>
      <input type="text" class="form-input block-caption-input" id="block-caption-${index}" data-index="${index}" placeholder="Ej: Bocetos iniciales de baja fidelidad..." value="${block.caption || ''}">
    `;
    
    parent.appendChild(row);
    parent.appendChild(captionGroup);

    // Eventos multimedia
    const fileInput = uploadGroup.querySelector('.block-file-input');
    fileInput.addEventListener('change', async (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      const file = e.target.files[0];
      if (!file) return;
      
      const filenameSpan = document.getElementById(`block-filename-${idx}`);
      filenameSpan.textContent = file.name;
      
      try {
        showToast("Subiendo multimedia...");
        const url = await storage.uploadFile(`content/${Date.now()}_${file.name}`, file);
        
        blockList[idx].url = url;
        
        // Mostrar vista previa
        const previewEl = document.getElementById(`block-preview-container-${idx}`);
        const previewImg = document.getElementById(`block-preview-img-${idx}`);
        previewImg.src = url;
        previewEl.classList.remove('hidden');
        
        showToast("Multimedia subido con éxito.");
      } catch (error) {
        console.error("Error al subir multimedia:", error);
        showToast("Error al subir multimedia.");
        fetch('/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'multimedia_upload_error', message: error.message || String(error), stack: error.stack })
        });
      }
    });

    const selectLayout = layoutGroup.querySelector('.block-layout-select');
    selectLayout.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      blockList[idx].layoutWidth = e.target.value;
    });

    const inputCaption = captionGroup.querySelector('.block-caption-input');
    inputCaption.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      blockList[idx].caption = e.target.value;
    });
  }

  // Eliminar un bloque
  function deleteBlock(index) {
    blockList.splice(index, 1);
    renderBlocksList();
  }

  // Mover un bloque (reordenar)
  function moveBlock(index, direction) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= blockList.length) return;
    
    // Intercambiar
    const temp = blockList[index];
    blockList[index] = blockList[targetIdx];
    blockList[targetIdx] = temp;
    
    renderBlocksList();
  }

  // ==========================================
  // ELIMINAR PROYECTO
  // ==========================================
  btnDeleteProject.addEventListener('click', async () => {
    if (!activeProjectId) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el proyecto "${projTitle.value}"? Esta acción no se puede deshacer.`)) {
      try {
        await db.deleteDoc('projects', activeProjectId);
        showToast("Proyecto eliminado correctamente.");
        btnCreateProject.click(); // Resetear editor a modo de creación
      } catch (error) {
        console.error("Error al eliminar proyecto:", error);
        showToast("Error al eliminar el proyecto.");
      }
    }
  });

  // ==========================================
  // GUARDAR PROYECTO (CREAR O EDITAR)
  // ==========================================
  btnSaveProject.addEventListener('click', async () => {
    // Validar formulario básico
    if (!projTitle.value || !projCompany.value || !projSlug.value || !projOrder.value) {
      showToast("Por favor, completa los campos requeridos en Información Básica.");
      form.reportValidity();
      return;
    }

    // Estructurar el objeto de proyecto
    const projectData = {
      title: projTitle.value,
      company: projCompany.value,
      slug: projSlug.value,
      order: parseInt(projOrder.value),
      thumbnailUrl: projThumbUrl.value,
      
      // Visibilidad de secciones
      sectionsVisibility: {
        hero: toggleHero.checked,
        content: toggleContent.checked,
        conclusions: toggleConclusions.checked
      },
      
      // Hero Area
      hero: {
        title: heroTitle.value,
        subtitle: heroSubtitle.value,
        imageUrl: heroImageUrl.value
      },
      
      // Resumen Estratégico
      summary: {
        client: summaryClient.value.trim(),
        sector: summarySector.value.trim(),
        projectType: summaryType.value.trim(),
        projectTypeLabel: summaryTypeLabel ? summaryTypeLabel.value.trim() : 'Tipo de proyecto',
        projectTypeFormat: summaryTypeFormat ? summaryTypeFormat.value : 'paragraph',
        tools: summaryTools.value.trim(),
        toolsLabel: summaryToolsLabel ? summaryToolsLabel.value.trim() : 'Herramientas y tecnologías',
        toolsFormat: summaryToolsFormat ? summaryToolsFormat.value : 'bullets',
        scope: summaryScope.value.trim(),
        scopeLabel: summaryScopeLabel ? summaryScopeLabel.value.trim() : 'Scope del proyecto',
        scopeFormat: summaryScopeFormat ? summaryScopeFormat.value : 'bullets',
        metrics: summaryMetrics.value.trim(),
        metricsLabel: summaryMetricsLabel ? summaryMetricsLabel.value.trim() : 'Métricas de impacto',
        metricsFormat: summaryMetricsFormat ? summaryMetricsFormat.value : 'bullets'
      },
      
      // Bloques de Contenido
      content: blockList,
      
      // Conclusiones
      conclusions: {
        results: conclusionResults.value,
        nextSteps: conclusionNextSteps.value
      }
    };

    try {
      showToast("Guardando proyecto...");
      
      if (activeProjectId) {
        // Editar proyecto existente
        await db.updateDoc('projects', activeProjectId, projectData);
        showToast("Cambios guardados con éxito.");
      } else {
        // Crear nuevo proyecto
        // Validar que el slug no esté repetido
        const slugRepeated = loadedProjects.some(p => p.slug === projectData.slug);
        if (slugRepeated) {
          showToast("El identificador (slug) ya está en uso. Elige otro.");
          projSlug.focus();
          return;
        }
        
        const newDoc = await db.addDoc('projects', projectData);
        activeProjectId = newDoc.id;
        showToast("Proyecto creado con éxito.");
        selectProject(activeProjectId); // Cargar el proyecto recién creado
      }
    } catch (error) {
      console.error("Error al guardar proyecto:", error);
      showToast("Error al guardar el proyecto en el servidor.");
      fetch('/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'save_error', message: error.message || String(error), stack: error.stack })
      });
    }
  });

  // Leer los valores de los custom fields desde el DOM (Eliminado)

  // Mostrar Toast
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
