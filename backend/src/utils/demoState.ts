import fs from 'fs';
import path from 'path';

const demoStatePath = path.join(__dirname, '../../demo_state.json');

export const getDemoState = (): boolean => {
  if (!fs.existsSync(demoStatePath)) {
    return false;
  }
  try {
    const data = fs.readFileSync(demoStatePath, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.isDemoMode === true;
  } catch (e) {
    return false;
  }
};

export const setDemoState = (isDemoMode: boolean) => {
  fs.writeFileSync(demoStatePath, JSON.stringify({ isDemoMode }), 'utf8');
};
