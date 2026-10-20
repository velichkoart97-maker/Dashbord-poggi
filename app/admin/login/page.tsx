import { login } from "@/admin/actions";
import s from "@/admin/admin.module.css";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className={s.loginWrap}>
      <form action={login} className={s.loginCard}>
        <h1>Админка дашборда</h1>
        <input type="password" name="password" placeholder="Пароль" autoFocus className={s.input} />
        {error && <div className={s.error}>Неверный пароль</div>}
        <button className={s.primary}>Войти</button>
      </form>
    </main>
  );
}
