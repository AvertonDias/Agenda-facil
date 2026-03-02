'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/admin');
    }
  }, [user, isUserLoading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await updateProfile(newUser, { displayName: name });

      // 1. Criar Perfil do Usuário
      await setDoc(doc(db, 'perfis_usuarios', newUser.uid), {
        id: newUser.uid,
        email: newUser.email,
        displayName: name,
        role: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Criar Documento da Empresa inicial (Crucial para as regras de segurança funcionarem)
      await setDoc(doc(db, 'empresas', newUser.uid), {
        id: newUser.uid,
        name: name,
        ownerId: newUser.uid,
        plan: 'Free',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Conta criada!',
        description: 'Seja bem-vindo ao AgendaFácil Pro.',
      });
      
      router.push('/admin');
    } catch (error: any) {
      toast({
        title: 'Erro no cadastro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Calendar className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
          <CardDescription>
            Comece a gerenciar seu salão de forma profissional hoje mesmo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Salão / Seu Nome</Label>
              <Input
                id="name"
                placeholder="Ex: Studio VIP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Entre aqui
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}