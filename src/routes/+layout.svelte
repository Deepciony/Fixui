<script lang="ts">
    import { beforeNavigate, goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { browser } from "$app/environment";
    import "./organizer/app.css";

    let { children } = $props();

    const ROLE_HOME: Record<string, string> = {
        student: "/student/event-list",
        officer: "/officer/event-list",
        organizer: "/organizer/events", // ✅ ใช้หน้า Events เป็นหลัก
    };

    const GUEST_PATHS = [
        "/",
        "/auth/login",
        "/auth/register",
        "/auth/verify-email",
        "/auth/forgot-password",
        "/auth/reset-password",
    ];

    const ALLOWED_DEEP_LINKS = [
        "/auth/reset-password",
        "/auth/verify-email",
        "/auth/forgot-password"
    ];

    let isAuthorized = $state(false);
    let isChecking = $state(true); // ใช้ตัวแปรนี้คุม Loading Screen แทน

    // ✅ ฟังก์ชันตรวจสอบ Token แบบละเอียด (เช็ค Expiry ด้วย)
    function validateToken() {
        if (!browser) return { token: null, role: null, isValid: false };
        
        const token = localStorage.getItem("access_token");
        if (!token) return { token: null, role: null, isValid: false };

        try {
            // เช็คโครงสร้าง JWT เบื้องต้น
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error("Invalid Token");

            // เช็ควันหมดอายุ
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const now = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < now) {
                // ถ้าหมดอายุ ให้ลบออกเลย จะได้ไม่เด้งไปเด้งมา
                localStorage.clear();
                sessionStorage.clear();
                return { token: null, role: null, isValid: false };
            }

            const infoStr = localStorage.getItem("user_info");
            const role = infoStr ? JSON.parse(infoStr).role?.toLowerCase() : null;
            
            return { token, role, isValid: true };
        } catch (e) {
            localStorage.clear();
            return { token: null, role: null, isValid: false };
        }
    }

    $effect(() => {
        if (!browser) return;

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "access_token" && event.newValue === null) {
                window.location.href = "/auth/login";
            }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    });

    beforeNavigate(({ to }) => {
        if (!to) return;
        sessionStorage.setItem("authorized_ticket", to.url.pathname);
    });

    // ✅ Logic หลัก (ทำงานทันที ไม่มี setTimeout)
    $effect(() => {
        if (!browser) return;

        const currentPath = $page.url.pathname;
        const { token, role, isValid } = validateToken(); // ตรวจสอบ Token ทันที

        const isAllowedDeepLink = ALLOWED_DEEP_LINKS.some(p => currentPath.startsWith(p));
        const isAuthPath = currentPath.startsWith("/auth") && !isAllowedDeepLink;
        const isGuestPath = GUEST_PATHS.some(p => currentPath.startsWith(p));

        // ---------------------------------------------------------
        // 1. กรณีไม่มี Token หรือ Token หมดอายุ (Guest)
        // ---------------------------------------------------------
        if (!isValid) {
            // ถ้าไม่ใช่หน้า Guest ให้ดีดไป Login
            if (!isGuestPath) {
                goto("/auth/login", { replaceState: true });
                return;
            }
            
            // ถ้าอยู่หน้า Login อยู่แล้ว อนุญาตให้แสดงผล
            isAuthorized = true;
            isChecking = false;
            return;
        }

        // ---------------------------------------------------------
        // 2. กรณีมี Token (Logged In)
        // ---------------------------------------------------------
        
        // ถ้าพยายามเข้าหน้า Login/Register ทั้งที่มี Token ให้ดีดไปหน้า Home ของ Role นั้น
        if (currentPath === "/" || isAuthPath) {
            const home = role && ROLE_HOME[role] ? ROLE_HOME[role] : "/student/event-list";
            goto(home, { replaceState: true });
            return; // ⛔️ สำคัญ: return เลย ไม่ต้องเซ็ต isAuthorized (หน้า Login จะไม่โผล่)
        }

        const home = role && ROLE_HOME[role] ? ROLE_HOME[role] : "/auth/login";
        const isRolePath = role && currentPath.startsWith(`/${role}`);
        const ticket = sessionStorage.getItem("authorized_ticket");

        if (!ticket) {
            // Refresh หน้าจอ: ถ้า URL ถูกต้องตาม Role ให้สร้าง Ticket ใหม่เลย (ไม่งั้นจะเด้งกลับ Home)
            if (isAllowedDeepLink || isRolePath) {
                 sessionStorage.setItem("authorized_ticket", currentPath);
            } else if (currentPath !== home) {
                sessionStorage.setItem("authorized_ticket", home);
                goto(home, { replaceState: true });
                return;
            }
        } else if (currentPath !== ticket) {
            // URL เปลี่ยนเอง: ยอมรับถ้าเป็นหน้าของ Role ตัวเอง
            if (isAllowedDeepLink || isRolePath) {
                sessionStorage.setItem("authorized_ticket", currentPath);
            } else {
                goto(ticket, { replaceState: true });
                isAuthorized = false;
                return;
            }
        }

        isAuthorized = true;
        isChecking = false;
    });
</script>

{#if isChecking}
    <div style="width: 100vw; height: 100vh; background-color: #111827; display: flex; align-items: center; justify-content: center;">
        </div>
{:else if isAuthorized}
    {@render children()}
{:else}
    <div style="width: 100vw; height: 100vh; background-color: #111827;"></div>
{/if}