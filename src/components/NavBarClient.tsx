"use client";

import React, { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";

export default function NavBarClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <NavBar />;
}
