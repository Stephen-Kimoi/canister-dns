use ic_cdk::api::time;
use ic_stable_structures::{StableVec, memory_manager::{MemoryManager, VirtualMemory, MemoryId}, DefaultMemoryImpl};
use ic_stable_structures::storable::{Storable, Bound};
use std::cell::RefCell;
use std::borrow::Cow;
use candid::{CandidType, Deserialize, Encode, Decode};

// Data model for a submission
#[derive(CandidType, Deserialize, Clone, Debug, Default)]
pub struct Submission {
    pub domain: String,
    pub canister_id: String,
    pub record_type: String, // "normal" or "subdomain"
    pub timestamp: u64,
}

impl Storable for Submission {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(&bytes, Self).unwrap()
    }
    const BOUND: Bound = Bound::Bounded { max_size: 1024, is_fixed_size: false };
}

type Memory = VirtualMemory<DefaultMemoryImpl>;
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    static SUBMISSIONS: RefCell<StableVec<Submission, Memory>> = RefCell::new(
        StableVec::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))).unwrap()
    );
}

#[ic_cdk::update]
pub fn submit(domain: String, canister_id: String, record_type: String) {
    let submission = Submission {
        domain,
        canister_id,
        record_type,
        timestamp: time(),
    };
    SUBMISSIONS.with(|subs| {
        let _ = subs.borrow_mut().push(&submission);
    });
}


#[ic_cdk::query]
pub fn get_submissions() -> Vec<Submission> {
    SUBMISSIONS.with(|subs| subs.borrow().iter().collect())
}

ic_cdk::export_candid!();