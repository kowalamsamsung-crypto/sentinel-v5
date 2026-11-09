(function (global) {
  'use strict';

  const busyInputs = new WeakSet();

  function capacitorHosts() {
    const result = [];
    const add = value => { if (value && !result.includes(value)) result.push(value); };
    try { add(global.Capacitor); } catch (_) {}
    try { if (global.parent && global.parent !== global) add(global.parent.Capacitor); } catch (_) {}
    try { if (global.top && global.top !== global) add(global.top.Capacitor); } catch (_) {}
    return result;
  }

  function findPlugin(name) {
    for (const host of capacitorHosts()) {
      let native = true;
      try {
        if (typeof host.isNativePlatform === 'function') native = host.isNativePlatform();
        else if (typeof host.getPlatform === 'function') native = host.getPlatform() !== 'web';
      } catch (_) {}
      if (!native) continue;
      let plugin = host.Plugins && host.Plugins[name];
      if (!plugin && typeof host.registerPlugin === 'function') {
        try { plugin = host.registerPlugin(name); } catch (_) {}
      }
      if (plugin) return { host, plugin };
    }
    return null;
  }

  function isNative() {
    const found = findPlugin('Camera');
    if (!found) return false;
    return true;
  }

  async function takePhotoFile() {
    const found = findPlugin('Camera');
    if (!found) throw new Error('Natywny aparat nie jest dostępny');

    const photo = await found.plugin.getPhoto({
      source: 'CAMERA',
      resultType: 'uri',
      quality: 82,
      correctOrientation: true,
      allowEditing: false,
      saveToGallery: false
    });
    const rawUrl = photo.webPath || photo.path;
    if (!rawUrl) throw new Error('Aparat nie zwrócił zdjęcia');
    const url = photo.webPath || (found.host.convertFileSrc ? found.host.convertFileSrc(rawUrl) : rawUrl);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Nie udało się odczytać wykonanego zdjęcia');
    const blob = await response.blob();
    return new File([blob], 'zdjecie-' + Date.now() + '.jpg', { type: blob.type || 'image/jpeg' });
  }

  async function takePhotoForInput(input) {
    if (!input || busyInputs.has(input)) return;
    busyInputs.add(input);
    input.disabled = true;
    try {
      const file = await takePhotoFile();
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (error) {
      if (!error || (error.message && !/cancel|anul/i.test(error.message))) {
        console.error('Nie udało się uruchomić aparatu:', error);
        alert('Nie udało się uruchomić aparatu. Sprawdź uprawnienie do kamery i spróbuj ponownie.');
      }
    } finally {
      input.disabled = false;
      busyInputs.delete(input);
    }
  }

  function imageInputFromClick(target) {
    if (!target || !target.closest) return null;
    const direct = target.closest('input[type="file"][accept*="image"]');
    if (direct) return direct;
    const label = target.closest('label[for]');
    if (!label) return null;
    const candidate = document.getElementById(label.htmlFor);
    return candidate && candidate.matches('input[type="file"][accept*="image"]') ? candidate : null;
  }

  document.addEventListener('click', event => {
    if (!isNative()) return;
    const input = imageInputFromClick(event.target);
    if (!input) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    takePhotoForInput(input);
  }, true);

  global.SentinelNativeCamera = { isNative, takePhotoFile, takePhotoForInput };
})(window);
