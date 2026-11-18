import type { AppModule } from '../core/module';
import notes from './notes';

/**
 * The app's sections, in tab order. To add a section: create
 * src/modules/<id>/index.tsx exporting defineModule({...}) and list it here.
 */
export const modules: AppModule[] = [notes];
