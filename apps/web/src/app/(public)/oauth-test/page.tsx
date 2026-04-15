'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Copy, Check, AlertCircle } from 'lucide-react';

export default function OAuthTestPage() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [copied, setCopied] = useState<'url' | 'key' | null>(null);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const redirect = `${window.location.origin}/auth/callback`;

    setSupabaseUrl(url);
    setSupabaseKey(key);
    setRedirectUrl(redirect);

    // Check current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session) {
        setSessionInfo(session.user);
      }
      if (error) {
        addLog(`Session check error: ${error.message}`);
      }
    });

    addLog('OAuth Test Page Loaded');
    addLog(`Supabase URL: ${url}`);
    addLog(`Redirect URL: ${redirect}`);
    addLog(`Environment check: ${url && key ? '✅ PASS' : '❌ FAIL'}`);
  }, []);

  const addLog = (message: string) => {
    setTestLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const testGoogleOAuth = async () => {
    addLog('Testing Google OAuth...');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserWarning: true,
        },
      });

      if (error) {
        addLog(`❌ Google OAuth Error: ${error.message}`);
        console.error('Google OAuth error:', error);
      } else {
        addLog('✅ Google OAuth initiated successfully');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog(`❌ Exception: ${message}`);
    }
  };

  const testGitHubOAuth = async () => {
    addLog('Testing GitHub OAuth...');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          skipBrowserWarning: true,
        },
      });

      if (error) {
        addLog(`❌ GitHub OAuth Error: ${error.message}`);
        console.error('GitHub OAuth error:', error);
      } else {
        addLog('✅ GitHub OAuth initiated successfully');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog(`❌ Exception: ${message}`);
    }
  };

  const testSupabaseConnection = async () => {
    addLog('Testing Supabase connection...');
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        addLog(`❌ Supabase connection error: ${error.message}`);
      } else {
        addLog('✅ Supabase connection successful');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog(`❌ Exception: ${message}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">OAuth Diagnostics</h1>
            <p className="text-white/60">Test your OAuth configuration and debug authentication issues</p>
          </div>

          {/* Session Status */}
          {sessionInfo && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl mb-8">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-emerald-400 font-semibold mb-1">✅ User Authenticated</p>
                  <p className="text-emerald-300/80 text-sm">Email: {sessionInfo.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Display */}
          <div className="space-y-6 mb-8">
            {/* Supabase URL */}
            <div className="bg-white/3 rounded-xl p-4 border border-white/5">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                Supabase URL
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-white/70 break-all bg-black/30 p-3 rounded border border-white/5">
                  {supabaseUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(supabaseUrl, 'url')}
                  className="p-2 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                >
                  {copied === 'url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                </button>
              </div>
            </div>

            {/* Redirect URL */}
            <div className="bg-white/3 rounded-xl p-4 border border-white/5">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                Redirect URL (for OAuth config)
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-white/70 break-all bg-black/30 p-3 rounded border border-white/5">
                  {redirectUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(redirectUrl, 'url')}
                  className="p-2 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                >
                  {copied === 'url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2">👆 Copy this URL and add it to both Supabase and Google Cloud Console</p>
            </div>

            {/* Supabase Key (masked) */}
            <div className="bg-white/3 rounded-xl p-4 border border-white/5">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                Supabase Anon Key
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-white/70 break-all bg-black/30 p-3 rounded border border-white/5">
                  {supabaseKey.substring(0, 20)}...{supabaseKey.substring(supabaseKey.length - 20)}
                </code>
                <button
                  onClick={() => copyToClipboard(supabaseKey, 'key')}
                  className="p-2 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                >
                  {copied === 'key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Button
              onClick={testSupabaseConnection}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl"
            >
              Test Supabase Connection
            </Button>
            <Button
              onClick={testGoogleOAuth}
              className="bg-white hover:bg-gray-100 text-black font-semibold py-3 rounded-xl"
            >
              Test Google OAuth
            </Button>
            <Button
              onClick={testGitHubOAuth}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl"
            >
              Test GitHub OAuth
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">Before testing:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-300/80">
                <li>Copy the <strong>Redirect URL</strong> above</li>
                <li>Add it to Supabase: Authentication → Providers → Google → Authorized redirect URIs</li>
                <li>Add it to Google Cloud: APIs & Services → Credentials → OAuth Client ID → Authorized redirect URIs</li>
                <li>Wait 1-2 minutes for changes to sync</li>
                <li>Then click "Test Google OAuth" below</li>
              </ol>
            </div>
          </div>

          {/* Test Log */}
          <div className="bg-black/30 rounded-xl p-4 border border-white/5">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">
              Test Log
            </label>
            <div className="space-y-1 font-mono text-xs text-white/60 max-h-96 overflow-y-auto">
              {testLog.length === 0 ? (
                <p className="text-white/30">Waiting for tests...</p>
              ) : (
                testLog.map((log, i) => (
                  <div key={i} className="text-white/50">
                    <span className="text-white/30">[{log.split(':')[0]}]</span> {log.split(':').slice(1).join(':')}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Links */}
          <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
            <a
              href="/login"
              className="inline-block text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              ← Back to Login
            </a>
            <div className="text-xs text-white/40 space-y-1">
              <p>
                <strong>Supabase Console:</strong>{' '}
                <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                  https://app.supabase.com
                </a>
              </p>
              <p>
                <strong>Google Cloud Console:</strong>{' '}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                  https://console.cloud.google.com/apis/credentials
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
