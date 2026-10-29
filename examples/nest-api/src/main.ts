import { createApp } from './app';
import { cfg } from './config';

createApp().then(app => app.listen(cfg.port, '0.0.0.0'));
