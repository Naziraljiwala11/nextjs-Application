"use client";

import { useQuery } from "@apollo/client";
import { GET_MENU_BY_NAME } from "../lib/queries";
import Link from "next/link";
import { useState } from "react";
import { Dialog, Popover } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Header() {
    const { data, loading, error } = useQuery(GET_MENU_BY_NAME, {
        variables: { id: "Primary Menu", idType: "NAME" },
        // fallback or default menu name needed
    });

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const menuItems = data?.menu?.menuItems?.nodes || [];

    // Filter top level items
    const topLevelItems = menuItems.filter((item: any) => !item.parentId);

    return (
        <header className="bg-white">
            <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">FnPressWire</span>
                        <span className="text-xl font-bold tracking-tight text-dark">FnPressWire</span>
                    </Link>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>
                <div className="hidden lg:flex lg:gap-x-12">
                    {loading ? (
                        <div className="flex space-x-4 animate-pulse">
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </div>
                    ) : (
                        topLevelItems.map((item: any) => (
                            <Link key={item.id} href={item.uri} className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary transition-colors">
                                {item.label}
                            </Link>
                        ))
                    )}
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    <Link href="/contact" className="text-sm font-semibold leading-6 text-gray-900">
                        Get Started <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>
            </nav>
            <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
                <div className="fixed inset-0 z-10" />
                <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="-m-1.5 p-1.5">
                            <span className="sr-only">FnPressWire</span>
                            <span className="text-xl font-bold">FnPressWire</span>
                        </Link>
                        <button
                            type="button"
                            className="-m-2.5 rounded-md p-2.5 text-gray-700"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-500/10">
                            <div className="space-y-2 py-6">
                                {topLevelItems.map((item: any) => (
                                    <Link
                                        key={item.id}
                                        href={item.uri}
                                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </Dialog.Panel>
            </Dialog>
        </header>
    );
}
