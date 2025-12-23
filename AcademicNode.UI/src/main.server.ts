import { bootstrapApplication } from '@angular/platform-browser';
// AICI AM CORECTAT: Importam clasa App din fisierul app
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(App, config);

export default bootstrap;
