import type { AppModule } from '../core/module';
import guide from './guide';
import meals from './meals';
import shopping from './shopping';
import routines from './routines';
import notes from './notes';

/**
 * The app's sections. The first three become tabs; all appear under More.
 * To add a section: create src/modules/<id>/index.tsx exporting
 * defineModule({...}) and list it here.
 */
export const modules: AppModule[] = [guide, meals, shopping, routines, notes];
