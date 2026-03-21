import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Mail, Lock, User, ChevronRight } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

type ModalView = "choice" | "login" | "register" | "forgot" | "reset" | "verify-sent" | "reset-sent";

interface Props {
  open: boolean;
  onClose: () => void;
  initialView?: ModalView;
  resetToken?: string;
}

function Input({
  type,
  placeholder,
  value,
  onChange,
  icon,
  rightIcon,
  onRightIconClick,
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-gray-400">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-green-400 focus:outline-none transition-colors"
      />
      {rightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          className="absolute right-3 text-gray-400 hover:text-gray-600"
        >
          {rightIcon}
        </button>
      )}
    </div>
  );
}

export function AuthModal({ open, onClose, initialView = "choice", resetToken }: Props) {
  const { login } = useAuth();
  const [view, setView] = useState<ModalView>(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (open) {
      setView(resetToken ? "reset" : initialView);
      setError("");
      setSuccessMsg("");
    }
  }, [open, initialView, resetToken]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccessMsg("");
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Tüm alanları doldurun.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kayıt başarısız.");
      } else {
        setView("verify-sent");
        resetForm();
      }
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("E-posta ve şifre zorunludur.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Giriş başarısız.");
      } else {
        window.location.reload();
      }
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      setError("E-posta adresinizi girin.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setView("reset-sent");
      resetForm();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setError("Yeni şifrenizi girin.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Şifre sıfırlama başarısız.");
      } else {
        setSuccessMsg("Şifren güncellendi! Şimdi giriş yapabilirsin.");
        setTimeout(() => {
          resetForm();
          setView("login");
        }, 2000);
      }
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-auto shadow-2xl overflow-hidden"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 pt-8">
            {/* CHOICE VIEW */}
            {view === "choice" && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🦉</div>
                  <h2 className="text-2xl font-bold text-gray-800">DuoTR'ye Hoş Geldin!</h2>
                  <p className="text-gray-500 mt-1">İlerlemeyi kaydetmek için giriş yap</p>
                </div>

                <button
                  onClick={() => login()}
                  className="w-full flex items-center justify-between bg-[#1877F2] text-white py-4 px-5 rounded-2xl font-semibold text-base hover:opacity-90 active:scale-95 transition-all"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">🔷</span>
                    Replit ile Giriş Yap
                  </span>
                  <ChevronRight size={18} />
                </button>

                <button
                  onClick={() => { resetForm(); setView("login"); }}
                  className="w-full flex items-center justify-between bg-white border-2 border-gray-200 text-gray-700 py-4 px-5 rounded-2xl font-semibold text-base hover:border-green-400 hover:text-green-600 active:scale-95 transition-all"
                >
                  <span className="flex items-center gap-3">
                    <Mail size={20} />
                    E-posta ile Giriş Yap
                  </span>
                  <ChevronRight size={18} />
                </button>

                <div className="text-center pt-2">
                  <span className="text-gray-500 text-sm">Hesabın yok mu? </span>
                  <button
                    onClick={() => { resetForm(); setView("register"); }}
                    className="text-green-500 font-bold text-sm hover:underline"
                  >
                    Kayıt Ol
                  </button>
                </div>
              </div>
            )}

            {/* LOGIN VIEW */}
            {view === "login" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Giriş Yap</h2>
                  <p className="text-gray-500 text-sm mt-1">E-posta ile devam et</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <Input
                  type="email"
                  placeholder="E-posta adresin"
                  value={email}
                  onChange={setEmail}
                  icon={<Mail size={18} />}
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifren"
                  value={password}
                  onChange={setPassword}
                  icon={<Lock size={18} />}
                  rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                />

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-[#58CC02] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#46a302] active:scale-95 transition-all disabled:opacity-60"
                >
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>

                <button
                  onClick={() => { setError(""); setView("forgot"); }}
                  className="w-full text-center text-gray-400 text-sm hover:text-gray-600"
                >
                  Şifreni mi unuttun?
                </button>

                <div className="border-t pt-4 text-center space-y-2">
                  <button
                    onClick={() => { resetForm(); setView("choice"); }}
                    className="text-gray-400 text-sm hover:text-gray-600"
                  >
                    ← Geri
                  </button>
                  <div>
                    <span className="text-gray-500 text-sm">Hesabın yok mu? </span>
                    <button
                      onClick={() => { resetForm(); setView("register"); }}
                      className="text-green-500 font-bold text-sm hover:underline"
                    >
                      Kayıt Ol
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* REGISTER VIEW */}
            {view === "register" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Hesap Oluştur</h2>
                  <p className="text-gray-500 text-sm mt-1">Ücretsiz kayıt ol, öğrenmeye başla!</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <Input
                  type="text"
                  placeholder="Adın Soyadın"
                  value={name}
                  onChange={setName}
                  icon={<User size={18} />}
                />
                <Input
                  type="email"
                  placeholder="E-posta adresin"
                  value={email}
                  onChange={setEmail}
                  icon={<Mail size={18} />}
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifre (en az 6 karakter)"
                  value={password}
                  onChange={setPassword}
                  icon={<Lock size={18} />}
                  rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifreyi tekrarla"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  icon={<Lock size={18} />}
                />

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-[#58CC02] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#46a302] active:scale-95 transition-all disabled:opacity-60"
                >
                  {loading ? "Kayıt olunuyor..." : "Kayıt Ol"}
                </button>

                <div className="border-t pt-3 text-center space-y-1">
                  <button
                    onClick={() => { resetForm(); setView("choice"); }}
                    className="text-gray-400 text-sm hover:text-gray-600"
                  >
                    ← Geri
                  </button>
                  <div>
                    <span className="text-gray-500 text-sm">Zaten hesabın var mı? </span>
                    <button
                      onClick={() => { resetForm(); setView("login"); }}
                      className="text-green-500 font-bold text-sm hover:underline"
                    >
                      Giriş Yap
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FORGOT PASSWORD */}
            {view === "forgot" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🔑</div>
                  <h2 className="text-2xl font-bold text-gray-800">Şifremi Unuttum</h2>
                  <p className="text-gray-500 text-sm mt-1">E-posta adresine sıfırlama bağlantısı göndereceğiz</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <Input
                  type="email"
                  placeholder="E-posta adresin"
                  value={email}
                  onChange={setEmail}
                  icon={<Mail size={18} />}
                />

                <button
                  onClick={handleForgot}
                  disabled={loading}
                  className="w-full bg-[#58CC02] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#46a302] active:scale-95 transition-all disabled:opacity-60"
                >
                  {loading ? "Gönderiliyor..." : "Sıfırlama E-postası Gönder"}
                </button>

                <button
                  onClick={() => { setError(""); setView("login"); }}
                  className="w-full text-center text-gray-400 text-sm hover:text-gray-600"
                >
                  ← Giriş sayfasına dön
                </button>
              </div>
            )}

            {/* RESET PASSWORD */}
            {view === "reset" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🔒</div>
                  <h2 className="text-2xl font-bold text-gray-800">Yeni Şifre Belirle</h2>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl px-4 py-3 text-sm">
                    {successMsg}
                  </div>
                )}

                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Yeni şifre (en az 6 karakter)"
                  value={password}
                  onChange={setPassword}
                  icon={<Lock size={18} />}
                  rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifreyi tekrarla"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  icon={<Lock size={18} />}
                />

                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full bg-[#58CC02] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#46a302] active:scale-95 transition-all disabled:opacity-60"
                >
                  {loading ? "Güncelleniyor..." : "Şifremi Güncelle"}
                </button>
              </div>
            )}

            {/* VERIFY SENT */}
            {view === "verify-sent" && (
              <div className="text-center py-4 space-y-4">
                <div className="text-6xl">📬</div>
                <h2 className="text-2xl font-bold text-gray-800">E-postanı Kontrol Et!</h2>
                <p className="text-gray-500 leading-relaxed">
                  Doğrulama bağlantısı e-posta adresine gönderildi. Bağlantıya tıklayarak hesabını aktifleştir.
                </p>
                <p className="text-gray-400 text-sm">Spam klasörünü de kontrol etmeyi unutma.</p>
                <button
                  onClick={onClose}
                  className="w-full bg-[#58CC02] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#46a302] active:scale-95 transition-all"
                >
                  Tamam
                </button>
              </div>
            )}

            {/* RESET SENT */}
            {view === "reset-sent" && (
              <div className="text-center py-4 space-y-4">
                <div className="text-6xl">📨</div>
                <h2 className="text-2xl font-bold text-gray-800">E-postanı Kontrol Et!</h2>
                <p className="text-gray-500 leading-relaxed">
                  Şifre sıfırlama bağlantısı gönderildi. Bağlantı 1 saat geçerlidir.
                </p>
                <button
                  onClick={onClose}
                  className="w-full bg-[#58CC02] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#46a302] active:scale-95 transition-all"
                >
                  Tamam
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
