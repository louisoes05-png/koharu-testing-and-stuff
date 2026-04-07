use std::sync::Arc;

use koharu_app::AppResources;
use koharu_runtime::RuntimeManager;
use tokio::sync::OnceCell;

#[derive(Clone)]
pub struct SharedState {
    inner: Arc<Inner>,
}

struct Inner {
    resources: Arc<OnceCell<AppResources>>,
    runtime: RuntimeManager,
    desktop_mode: bool,
}

impl SharedState {
    pub fn new(
        resources: Arc<OnceCell<AppResources>>,
        runtime: RuntimeManager,
        desktop_mode: bool,
    ) -> Self {
        Self {
            inner: Arc::new(Inner {
                resources,
                runtime,
                desktop_mode,
            }),
        }
    }

    pub fn get(&self) -> Option<AppResources> {
        self.inner.resources.get().cloned()
    }

    pub fn runtime(&self) -> RuntimeManager {
        self.inner.runtime.clone()
    }

    pub fn desktop_mode(&self) -> bool {
        self.inner.desktop_mode
    }
}
